# Strapi 遅延・不安定化 改善 runbook（2026-04-24）

- 対象: `mizzz.jp` / `store.mizzz.jp` / `fc.mizzz.jp` + Strapi backend
- 更新日: 2026-04-24
- 目的: 「遅い」「読めない」を同時に切り分け、再発防止までを運用できる状態にする

## 1. 現状と切り分け結果（初期仮説）

### 1-1. Strapi 遅延の直接原因候補
1. endpoint ごとの `populate` 深さと payload が大きく、特に media/related を含むページで応答時間がぶれる。
2. DB 側の index がアクセス実態と一致しないと `locale + slug + publishAt` 系の filter/sort が重くなる。
3. Strapi 側で slow request 可視化が薄いと、断続的な latency spike を捉えづらい。

### 1-2. 読み込み失敗の直接原因候補
1. timeout 到達時の一時失敗（cold start / network jitter / upstream timeout）。
2. 非 JSON 応答（proxy 側 HTML など）混入時の parse 失敗。
3. frontend 側の stale 許容・再検証・エラー分類が弱い endpoint がある場合の白画面化。

### 1-3. 影響範囲
- frontend 共通 API クライアント（main/store/fc 共通）
- backend middleware（Strapi 全 API 共通）
- env / runbook

## 2. 今回実施した改善

### 2-1. frontend fetch hardening / fallback
- `strapiGet` に traceId・latency・cache state を含む telemetry 発火を追加。
- fresh/stale cache hit を明示し、背景再検証時の観測可能性を向上。
- timeout/network/cancel の失敗時に `requestStartedAt` / `failureAt` / `latencyMs` / `traceId` を保持し、原因切り分けを高速化。

### 2-2. backend monitoring / health 補強
- `global::strapi-observability` middleware を追加。
- `/api/*` の処理時間を `server-timing` ヘッダとログへ記録。
- `API_SLOW_REQUEST_MS` 超過時に warn、5xx は error、通常系はサンプリング info として出力。

### 2-3. env / runtime 整理
- frontend に Strapi timeout/retry/cache/debug log の env を明示。
- backend に slow threshold / trace sample rate の env を追加。

## 3. API / query / payload 最適化方針

1. 一覧系は `fields` + 必須 media のみ populate（`*` 禁止）。
2. 詳細系は relation を用途単位で分離し、重い relation は lazy fetch を検討。
3. locale ごとに cache key を分離し、誤キャッシュを防止。
4. `publicationState` / preview は token 必須の経路と public 経路を明示的に分離。

## 4. DB / index 改善方針（次段）

1. `EXPLAIN ANALYZE` で上位遅延 query を抽出。
2. 高頻度条件（`slug`, `locale`, `publishedAt`, `updatedAt`, `sortOrder`）に限定して index 追加。
3. count が不要な一覧 endpoint は `withCount=false` を維持。
4. relation 深さの高い endpoint は endpoint 分割（summary/detail）で JOIN 負荷を低減。

## 5. cache / revalidation / media 方針

1. frontend の stale-while-revalidate を維持しつつ TTL を env 管理。
2. CDN で media を配信し、API payload の責務と分離。
3. locale / publication state を含めた cache key を徹底。
4. content 更新直後の invalidate 対象 endpoint を runbook 化。

## 6. 監視・障害対応手順

1. まず `/_health`, `/_ready` を確認。
2. 該当導線の browser network で `x-request-id` / `server-timing` を取得。
3. backend log で `requestId` と `[strapi-observability]` を突合。
4. timeout / HTML 応答 / 5xx / slow-request のどれかを分類。
5. DB slow query と同時刻突合（必要時）。

## 7. GitHub Secrets / Variables 整理

- frontend:
  - `VITE_STRAPI_TIMEOUT_MS`
  - `VITE_STRAPI_RETRY_COUNT`
  - `VITE_STRAPI_RESPONSE_CACHE_TTL_MS`
  - `VITE_STRAPI_RESPONSE_CACHE_STALE_TTL_MS`
  - `VITE_STRAPI_DEBUG_LOG`（通常 false）
- backend:
  - `API_SLOW_REQUEST_MS`
  - `API_TRACE_SAMPLE_RATE`

## 8. 一次切り分けチェックリスト

1. 失敗は常時か断続か。
2. 失敗は全 endpoint か一部 endpoint か。
3. 同時刻に slow-request / 5xx が増加しているか。
4. 特定 locale / 特定 populate でのみ再現するか。
5. media 配信遅延が体感遅延の主因になっていないか。

## 9. 残課題（次 PR）

1. endpoint 別 latency ダッシュボードの自動集計。
2. DB 実測にもとづく index migration の確定。
3. webhook 連動の selective cache invalidation。
4. 管理画面（admin）操作の体感速度計測。

## 10. 仮定

1. 本番 DB 種別は postgres または mysql で、sqlite は主に local 検証用途。
2. reverse proxy / CDN で `server-timing` を透過できる構成を採用可能。
3. frontend は `strapiGet` を共通利用しており、追加 telemetry が main/store/fc の大半導線に波及する。
