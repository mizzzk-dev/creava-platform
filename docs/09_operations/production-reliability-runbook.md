# 本番運用 / 監視 / 障害対応 / セキュリティ強化ランブック

- 更新日: 2026-04-18
- 対象: main (`mizzz.jp`), store (`store.mizzz.jp`), fc (`fc.mizzz.jp`), Strapi backend / CMS
- 目的: 継続運用中の障害・公開事故を減らし、検知と復旧を速める
- 関連: [deploy-manual](./deploy-manual.md), [troubleshooting](./troubleshooting.md), [release-checklist](../10_appendix/release-checklist.md), [environment-variables](../10_appendix/environment-variables.md)

---

## 0. 今回の調査結果（現状課題）

### 0-1. 現在の本番運用課題
1. Frontend CI は強いが、backend は PR 時に build 検証が不足していた。
2. 定期的な死活確認（main/store/fc/API）が自動化されていなかった。
3. health endpoint は存在する前提だったが、readiness 相当の DB 到達確認が不足していた。
4. request 単位の共通IDがなく、frontend error と backend log を追跡しづらかった。
5. release checklist は存在するが、auth/form/upload/SEO/monitoring の観点が不足していた。

### 0-2. 障害が起きやすい箇所
- `inquiry-submissions/public`（フォーム導線）
- `callback` 周辺（認証導線）
- Strapi API 非JSON応答（HTML混入）
- upload 容量超過 / MIME不一致
- デプロイ後の site URL / sitemap 不整合

### 0-3. 監視不足の箇所
- main/store/fc の疎通監視（HTTP 200 + 文字列整合）
- backend readiness（DB 到達）
- リリース後の主要導線（FAQ/contact）

### 0-4. セキュリティ上の懸念
- ログに生IPが残る箇所があり、運用ログ最小化の改善余地があった。
- CORS の exposed headers が不足し、request-id 連携が難しかった。

### 0-5. バックアップ / 復旧の弱点
- DB/media/env の「取得頻度」「保持期間」「復旧担当」の記述が分散。
- staging での restore drill の手順が弱い。

### 0-6. リリース品質保証の不足
- build/lint/test 以外の運用チェック（health, alerts, rollback drill）が不足。

---

## 1. 追加した運用機能一覧

1. backend に `/_health` と `/_ready` を追加（DB ready check つき）。
2. `x-request-id` を全リクエストへ付与する middleware を追加。
3. rate-limit / request-audit / json-api-error を request-id 対応 + IPハッシュ化。
4. フォーム送信クライアントで content-type 検証と request-id 付きエラーを追加。
5. GitHub Actions に 15分間隔の synthetic monitoring workflow を追加。
6. GitHub Actions CI に backend build job を追加。
7. release checklist / deploy manual / troubleshooting / env docs を運用観点で更新。

---

## 2. health / monitoring 設計

### 2-1. 監視対象（production）
- `https://mizzz.jp/`
- `https://store.mizzz.jp/`
- `https://fc.mizzz.jp/`
- `https://mizzz.jp/faq`
- `https://mizzz.jp/contact`
- `MONITORING_BACKEND_HEALTH_URL`（`/_health`）
- `MONITORING_BACKEND_READY_URL`（`/_ready`）

### 2-2. 監視対象（staging）
- `https://stg.mizzz.jp/`
- `https://store-stg.mizzz.jp/`
- `https://fc-stg.mizzz.jp/`
- backend staging health/readiness URL

### 2-3. 監視方式
- GitHub Actions schedule (`*/15 * * * *`) で低コスト実装。
- URL 200 だけでなく、最小キーワード（`mizzz` / `store` / `fanclub` / `faq` / `contact`）を確認。
- backend は `/_health` で liveness、`/_ready` で DB 到達を確認。

---

## 3. logging / error handling / tracing

1. backend 共通 `request-id` を導入し、レスポンスに `x-request-id` を付与。
2. rate-limit / request-audit / json-api-error のログに `rid=` を付与。
3. audit/rate-limit ログは生IPではなく `ipHash` を記録。
4. `json-api-error` は production で内部 details を露出せず `requestId` のみ返却。
5. 問い合わせAPIのレスポンスにも `requestId` を含め、調査時に照合可能化。
6. frontend 問い合わせ送信で HTML 混入・非JSONを検知して明示エラー化。

---

## 4. security hardening

1. `strapi::security` の `hidePoweredBy`, `xssFilter`, `noSniff` を明示。
2. `strapi::poweredBy` middleware を除外（情報露出抑制）。
3. CORS に `X-Request-Id` / `Retry-After` の exposed headers を追加。
4. `CORS_ALLOW_CREDENTIALS` を env 管理へ移動し、環境ごと制御可能化。
5. upload 制御は既存 `UPLOAD_MAX_FILE_SIZE_BYTES` + 問い合わせ側 MIME/拡張子制御を継続。

---

## 5. backup / restore 方針（最低限DR）

### 5-1. バックアップ対象
- DB（Strapi content + inquiry + analytics）
- uploads/media（フォーム添付含む）
- runtime env（Strapi Cloud / VPS / GitHub Environments）
- schema/migration 相当（content-type JSON, config）

### 5-2. 取得頻度（推奨）
- DB: 日次 + リリース前
- media: 日次 or 週次差分
- env 設定: 変更時ごと（監査ログ付き）

### 5-3. 保持期間（推奨）
- DB: 30日
- media: 30〜90日（容量に応じて）
- 監査ログ: 90日

### 5-4. restore 手順（叩き台）
1. staging に DB + media をリストア。
2. `/_ready` が `ready` になることを確認。
3. main/store/fc 主要ページ、form submit、FAQ/guide API を確認。
4. 問題なければ production へ同手順で適用。

### 5-5. 役割分担
- 実行: 運用当番（primary）
- 承認: リリース責任者
- 検証: フロント/バックエンド担当

---

## 6. release / rollback / checklist

### 6-1. リリース前必須
- frontend test/lint/build
- backend build
- health/readiness endpoint 応答
- auth callback / form submit / upload / FAQ / guide / SEO確認
- 多言語（ja/en/ko）・light/dark・mobile確認

### 6-2. リリース後必須
- synthetic monitoring が green であること
- rate-limit / json-api-error / inquiry log に異常増加がないこと

### 6-3. rollback 方針
- frontend: 直前の安定コミットを再デプロイ
- backend: 直前安定版へ戻し、必要に応じ DB restore
- 切り戻し判断基準: 主要導線（home/contact/auth/checkout）いずれか致命障害

---

## 7. CI/CD / environment 運用改善

1. CI に backend build を追加（PR段階で破壊検知）。
2. synthetic monitoring workflow を staging/production の environment 切替対応で追加。
3. monitoring 用の backend URL は GitHub Environment Secrets で分離管理。
4. runtime env（Strapi Cloud/VPS）と CI secrets の責務を分離。

---

## 8. 障害時初動（15分以内）

1. 監視失敗ジョブの対象URLを確認。
2. `/_health` / `/_ready` の結果確認。
3. `x-request-id` があるユーザー報告は該当IDでログ追跡。
4. フォーム障害時: `inquiry-submissions/public` の 4xx/5xx と upload 失敗有無確認。
5. 認証障害時: callback URL / Logto secret / CORS 整合確認。
6. CMS障害時: Strapi status + DB到達 + draft/publish 状態を確認。

---

## 9. secrets / env / DNS 整理

### 9-1. 追加・更新した env
- backend: `READINESS_TIMEOUT_MS`, `CORS_ALLOW_CREDENTIALS`, `AUDIT_IP_HASH_SALT`
- GitHub Secrets: `MONITORING_BACKEND_HEALTH_URL`, `MONITORING_BACKEND_READY_URL`

### 9-2. local / staging / production 差分
- `CORS_ALLOW_CREDENTIALS` は環境別に `false/true` を明示運用（既定 false）。
- monitoring URL は環境ごとに別値設定。

### 9-3. DNS 変更要否
- 今回の改善は既存URL/endpoint内で完結するため **DNS変更は不要**。

---

## 10. ブランチ名案 / 実装順

- ブランチ名: `operations-hardening-foundation`
- 実装順:
  1) 現状調査
  2) backend health/readiness + request-id
  3) logging/error handling hardening
  4) CI/CD monitoring 追加
  5) release/rollback/docs 更新

---

## 11. 残課題（次PR候補）

1. 監視アラートを Slack/Webhook に通知（夜間対応強化）。
2. backup/restore の自動化スクリプト化（手順依存を削減）。
3. 認証 callback / form submit の E2E を CI に追加。
4. dependency vulnerability の定期スキャン（週次）を追加。

---

## 仮定

1. backend `/_health` は既存運用で参照される前提だったため、互換を保って拡張した。
2. staging ドメイン（`stg/store-stg/fc-stg`）は既存運用の docs/CI 記載を正として扱った。
3. 監視通知先（Slack等）は未定のため、まずは GitHub Actions failure を一次検知とした。
