# Strapi 公開反映 / Preview / Webhook Revalidation / Locale 運用 runbook

- 更新日: 2026-04-24
- 対象: main (`mizzz.jp`) / store (`store.mizzz.jp`) / fc (`fc.mizzz.jp`) / Strapi backend
- 目的: 「速い」ことと「公開反映が正しい」ことを分離し、更新反映事故（反映漏れ・locale混線・下書き混入・古いキャッシュ残り）を減らす

## 1. 現状の公開反映経路（今回の整理結果）

1. editor が Strapi で entry を更新（draft/publish/unpublish/delete）。
2. Strapi webhook が backend `POST /api/cms-sync/strapi-webhook` を呼ぶ。
3. backend が secret / event / model / locale / publish state を検証し、content dependency map から影響対象（site/path/tag）を算出。
4. 算出結果と traceId を監査ログ（`internal-audit-log`）に保存する。
5. frontend 側は `strapiGet` の stale-while-revalidate cache を維持しつつ、manual revalidate API を運用導線として使う。

> 注: 現時点の frontend は CSR キャッシュであるため、CDN/SSR の tag revalidate は別PRで接続する。今回は webhook payload の標準化と監査可能性を先に整備した。

## 2. 変更内容（実装）

### 2-1. webhook / preview / manual revalidate endpoint を追加

- `POST /api/cms-sync/strapi-webhook`
  - ヘッダ `x-strapi-webhook-secret` を検証
  - `event/model/entry/locale/publishedAt` から公開状態を判定
  - content dependency map で対象 site/path/tag を返却
  - 監査ログに `strapi_webhook_revalidate` を保存
- `POST /api/cms-sync/preview/verify`
  - preview secret を backend で検証
  - frontend bundle に secret を置かない運用へ移行可能
  - 監査ログに `strapi_preview_verify` を保存
- `POST /api/cms-sync/revalidate`
  - ヘッダ `x-cms-ops-token` を検証
  - manual revalidate を監査付きで実施

### 2-2. frontend preview 導線を backend verify 対応

- `VITE_PREVIEW_VERIFY_ENDPOINT` が設定されている場合は backend verify を優先。
- backend verify 失敗時は互換の `VITE_PREVIEW_SECRET` を fallback として利用（段階移行用）。
- preview verify 成功時のみ sessionStorage に preview state を保存。

### 2-3. 監査性・追跡性

- すべての webhook / preview verify / manual revalidate に `traceId` を付与。
- `internal-audit-log` に action / target / locale / path / tag / requestId を保存。
- 運用者は「更新したのに反映されない」を traceId で backend ログと突合できる。

## 3. locale / draft / published / preview の責務

- draft:
  - preview でのみ表示対象。
  - public フローに混入させない。
- published:
  - webhook 経由で再検証対象を算出。
- preview:
  - editor だけが backend verify を通って有効化。
  - locale は `ja/en/ko` を正規化して扱う。
- locale:
  - invalidation 対象は locale を明示的に保持し、横断 invalidate を避ける。

## 4. content dependency（初期マップ）

- `news-item`: main `/news`, `/`
- `blog-post`: main `/blog`, `/`
- `event`: main `/events`, `/`
- `work`: main `/works`, `/`
- `store-product`: store `/store`, `/store/products` + main `/`
- `fanclub-content`: fc `/fanclub`, `/member` + main `/`
- `site-setting`: main/store/fc の主要導線

未定義 model は `global-fallback` として扱い、監査ログで拡張候補として残す。

## 5. env / secrets

### frontend
- `VITE_PREVIEW_VERIFY_ENDPOINT`（推奨）
- `VITE_PREVIEW_SECRET`（互換 fallback。最終的には空運用推奨）

### backend
- `STRAPI_PUBLISH_WEBHOOK_SECRET`
- `PREVIEW_SHARED_SECRET`
- `CMS_REVALIDATE_OPS_TOKEN`

### GitHub Secrets（推奨）
- `STRAPI_PUBLISH_WEBHOOK_SECRET`
- `PREVIEW_SHARED_SECRET`
- `CMS_REVALIDATE_OPS_TOKEN`
- `VITE_PREVIEW_VERIFY_ENDPOINT`

## 6. editor / admin の確認手順

1. Strapi で draft 更新後、preview ボタンから `/preview` 遷移。
2. preview banner が表示され、対象 locale の下書きが見えることを確認。
3. publish 実行後、Strapi webhook delivery が 2xx であることを確認。
4. backend 監査ログで `strapi_webhook_revalidate` の最新 traceId を確認。
5. 反映遅延時は manual revalidate API を実行し、`strapi_manual_revalidate` 監査ログを確認。

## 7. 障害時の一次切り分け

- preview だけ失敗:
  - `PREVIEW_SHARED_SECRET` と frontend query の secret 不一致を確認。
- publish 後に反映されない:
  - webhook の `x-strapi-webhook-secret` 不一致 / 未設定を確認。
  - `internal-audit-log` に `strapi_webhook_revalidate` が残っているか確認。
- locale だけ古い:
  - payload locale が `ja/en/ko` に正規化されているか確認。
  - manual revalidate で locale 指定再実行。

## 8. 既知の残課題

- CDN / SSR runtime のタグ再検証（path/tag invalidation）を本番配信基盤へ接続する追加実装が必要。
- relation 更新時の依存面展開（親子モデル追跡）を map 自動生成へ拡張する余地がある。
- preview share link（期限付き）の導入は次PRで実施。

## 9. 仮定

- frontend は CSR 主体で、グローバルな HTML ISR は未導入と仮定。
- Strapi webhook payload は `event/model/entry` を含む標準形式を前提。
- `internal-audit-log` への write 権限は backend runtime が保持している前提。
