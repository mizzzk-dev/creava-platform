# 環境変数設定手順書（フォーム運用基盤強化版）

- 更新日: 2026-04-18
- 対象: frontend / backend / GitHub Actions
- 目的: 問い合わせ運用（通知・CSV・スパム対策・添付運用）を環境差分込みで安全に運用する
- 関連: [フォーム運用マニュアル](../09_operations/form-operations-manual.md), [deploy-manual](../09_operations/deploy-manual.md)

## 1. frontend 変数（local / staging / production）

| 変数 | 用途 | local | staging | production |
|---|---|---|---|---|
| `VITE_SITE_TYPE` | サイト種別 (`main`/`store`/`fanclub`) | 必須 | 必須 | 必須 |
| `VITE_SITE_URL` | 現在のサイトURL | localhost | stgドメイン | 本番ドメイン |
| `VITE_MAIN_SITE_URL` | main URL | 任意 | 必須 | 必須 |
| `VITE_STORE_SITE_URL` | store URL | 任意 | 必須 | 必須 |
| `VITE_FANCLUB_SITE_URL` | fanclub URL | 任意 | 必須 | 必須 |
| `VITE_STRAPI_API_URL` | 問い合わせ送信先/コンテンツAPI | 必須 | 必須 | 必須 |
| `VITE_STRAPI_API_TOKEN` | 公開コンテンツ取得トークン | 任意 | 推奨 | 推奨 |
| `VITE_LOGTO_*` | 認証 | 任意 | 必須 | 必須 |
| `VITE_SHOPIFY_*` | store 商品取得 | 任意 | 必須 | 必須 |
| `VITE_STRIPE_PUBLISHABLE_KEY` | 決済公開キー | 任意 | 必須 | 必須 |
| `VITE_PERSONALIZATION_MAX_HISTORY` | 閲覧履歴の保存上限 | 任意 | 任意 | 任意 |
| `VITE_PERSONALIZATION_MAX_FAVORITES` | お気に入り保存上限 | 任意 | 任意 | 任意 |
| `VITE_ANALYTICS_OPS_ENDPOINT` | 主要イベントをStrapiへ保存するエンドポイント | 任意 | 推奨 | 推奨 |
| `VITE_PREVIEW_SECRET` | Strapi previewエントリー用シークレット | 必須 | 必須 | 必須 |

## 2. backend 変数（フォーム運用関連を含む）

| 変数 | 用途 | 必須度 |
|---|---|---|
| `INQUIRY_MAX_FILE_BYTES` | 添付サイズ上限 | 必須 |
| `INQUIRY_MAX_FILES` | 添付件数上限 | 必須 |
| `INQUIRY_SPAM_WINDOW_MS` | 連投判定ウィンドウ | 必須 |
| `INQUIRY_SPAM_MAX_PER_WINDOW` | 連投閾値 | 必須 |
| `INQUIRY_DUPLICATE_WINDOW_MS` | 同一payload連投判定 | 推奨 |
| `INQUIRY_IP_HASH_SALT` | IPハッシュソルト | 必須 |
| `INQUIRY_OPS_TOKEN` | CSV/検索/集計 API 保護トークン | 必須 |
| `ANALYTICS_OPS_TOKEN` | analytics ops summary API 保護トークン | 推奨 |
| `ANALYTICS_IP_HASH_SALT` | analytics IPハッシュソルト | 推奨 |
| `INQUIRY_NOTIFY_TO` | 管理通知メール宛先（カンマ区切り） | 任意 |
| `INQUIRY_ENABLE_AUTO_REPLY` | 自動返信有効化 (`true/false`) | 任意 |
| `INQUIRY_REPLY_SLA_DAYS` | 自動返信本文の返信目安日数 | 任意 |
| `UPLOAD_MAX_FILE_SIZE_BYTES` | Upload Plugin サイズ上限 | 必須 |
| `LIFECYCLE_EMAIL_FROM` | ライフサイクル配信の送信元メール（SMTP_FROMを上書きする場合） | 任意 |
| `LIFECYCLE_DELIVERY_BATCH_SIZE` | 1回の配信バッチ送信件数 | 任意 |
| `LIFECYCLE_DELIVERY_DRY_RUN` | `true` の場合は送信せず delivery-log のみ記録 | 任意 |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | API全体レート制限 | 推奨 |
| `AUDIT_WINDOW_MS` / `AUDIT_404_THRESHOLD` | 監査ログ閾値 | 推奨 |

## 3. GitHub Secrets（推奨一覧）

### Frontend build/deploy
- `VITE_STRAPI_API_URL`
- `VITE_STRAPI_API_TOKEN`
- `VITE_LOGTO_ENDPOINT`
- `VITE_LOGTO_APP_ID`
- `VITE_LOGTO_API_RESOURCE`
- `VITE_SHOPIFY_STORE_DOMAIN`
- `VITE_SHOPIFY_STOREFRONT_TOKEN`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_PREVIEW_SECRET`
- FTP 系 (`FTP_SERVER_*`, `FTP_USERNAME_*`, `FTP_PASSWORD_*`, `FTP_SERVER_DIR_*`)

### Backend deploy/runtime
- `STRAPI_DEPLOY_TOKEN`
- `STRAPI_PREVIEW_SECRET`（frontend `VITE_PREVIEW_SECRET` と同値）
- `INQUIRY_IP_HASH_SALT`
- `INQUIRY_OPS_TOKEN`
- `ANALYTICS_OPS_TOKEN`
- `ANALYTICS_IP_HASH_SALT`
- `INQUIRY_NOTIFY_TO`（通知を使う場合）
- SMTP で必要な Secret（`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`）

## 4. GitHub Variables（推奨一覧）
- `VITE_SNS_X_URL`
- `VITE_SNS_INSTAGRAM_URL`
- `VITE_SNS_NOTE_URL`
- `VITE_SNS_YOUTUBE_URL`
- （必要時）`VITE_MAIN_SITE_URL`, `VITE_STORE_SITE_URL`, `VITE_FANCLUB_SITE_URL`

## 5. runtime env 設定手順
1. backend 環境（local/staging/prod）に `backend/.env.example` をベースに値を投入。
2. `INQUIRY_OPS_TOKEN` を 32 文字以上のランダム値で生成。
3. 通知を有効化する場合は SMTP 設定 + `INQUIRY_NOTIFY_TO` を設定。
4. 自動返信を有効化する場合のみ `INQUIRY_ENABLE_AUTO_REPLY=true` を設定。

## 6. DNS 変更要否
- 本施策は既存の `mizzz.jp / store.mizzz.jp / fc.mizzz.jp` と既存 Strapi API 内で完結するため、**DNS 追加・変更は不要**。

## 7. upload provider 切替（local → S3/R2）
1. Strapi の upload provider 設定を `backend/config/plugins.ts` で切替。
2. 添付メタデータは `attachmentMetadata` に保持されるため、保存先変更後も運用画面側の参照項目は維持可能。
3. バケットライフサイクルで保持期間（例: 365 日）を設定し、`status=closed/spam` の長期データを段階削除する。

## 追補: 共通フォームプラットフォーム（2026-04）

### backend 追加推奨 env
- `INQUIRY_NOTIFY_TO_MAIN_CONTACT`
- `INQUIRY_NOTIFY_TO_MAIN_REQUEST`
- `INQUIRY_NOTIFY_TO_MAIN_COLLABORATION`
- `INQUIRY_NOTIFY_TO_MAIN_EVENT`
- `INQUIRY_NOTIFY_TO_STORE_STORE_SUPPORT`
- `INQUIRY_NOTIFY_TO_FC_FC_SUPPORT`

> 未設定時は既存の `INQUIRY_NOTIFY_TO` にフォールバック。

### GitHub Secrets（デプロイ時）
- 上記 env を Secrets に追加し、backend デプロイ環境に同期する。
- 命名例: `PROD_INQUIRY_NOTIFY_TO_MAIN_REQUEST`。

### DNS
- 共通フォーム化による DNS 変更は不要。


## 8. 監視運用（2026-04 追加）

### backend runtime env
- `READINESS_TIMEOUT_MS`: `/_ready` の DB 判定タイムアウト（ms）。
- `CORS_ALLOW_CREDENTIALS`: CORS credentials 許可フラグ。
- `AUDIT_IP_HASH_SALT`: request-audit / rate-limit 用 IP ハッシュソルト。

### GitHub Environment Secrets
- `MONITORING_BACKEND_HEALTH_URL`: 監視対象 backend の `/_health` URL。
- `MONITORING_BACKEND_READY_URL`: 監視対象 backend の `/_ready` URL。

### 補足
- monitoring は `.github/workflows/ops-monitoring.yml` から参照される。
- staging / production で URL を分離して設定すること。
- 既存ドメインで完結するため DNS 変更は不要。
