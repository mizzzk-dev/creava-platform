# 環境変数設定手順書（フォーム運用基盤強化版）

- 更新日: 2026-04-19
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
| `VITE_USER_SYNC_ENABLED` | user provisioning bridge の有効化 | 任意 | 任意 | 任意 |
| `VITE_USER_LIFECYCLE_ONBOARDING_ENABLED` | lifecycle/onboarding UI 表示フラグ | 任意 | 推奨 | 推奨 |
| `VITE_ONBOARDING_REMINDER_DAYS` | onboarding 再表示までの日数 | 任意 | 任意 | 推奨 |
| `VITE_MEMBERSHIP_STATE_SYNC_INTERVAL_SEC` | frontend で state summary を再同期する間隔（秒） | 任意 | 推奨 | 推奨 |
| `VITE_RENEWAL_REMINDER_DAYS` | renewal前 notice 表示開始日数 | 任意 | 推奨 | 推奨 |
| `VITE_GRACE_RECOVERY_DAYS` | grace recovery 導線の既定表示日数 | 任意 | 推奨 | 推奨 |
| `VITE_WINBACK_WINDOW_DAYS` | expired/canceled 向け win-back 導線表示日数 | 任意 | 推奨 | 推奨 |
| `VITE_LIFECYCLE_MESSAGE_COOLDOWN_HOURS` | lifecycle message の最小再送間隔 | 任意 | 推奨 | 推奨 |
| `VITE_SHOPIFY_*` | store 商品取得 | 任意 | 必須 | 必須 |
| `VITE_STRIPE_PUBLISHABLE_KEY` | 決済公開キー | 任意 | 必須 | 必須 |
| `VITE_PERSONALIZATION_MAX_HISTORY` | 閲覧履歴の保存上限 | 任意 | 任意 | 任意 |
| `VITE_PERSONALIZATION_MAX_FAVORITES` | お気に入り保存上限 | 任意 | 任意 | 任意 |
| `VITE_ANALYTICS_OPS_ENDPOINT` | 主要イベントをStrapiへ保存するエンドポイント | 任意 | 推奨 | 推奨 |
| `VITE_PREVIEW_SECRET` | Strapi previewエントリー用シークレット | 必須 | 必須 | 必須 |

### frontend 認証（Logto）詳細
- `VITE_LOGTO_ENDPOINT`（Hosted Sign-in: custom domain 推奨）
- `VITE_LOGTO_APP_ID_MAIN`
- `VITE_LOGTO_APP_ID_STORE`
- `VITE_LOGTO_APP_ID_FC`
- `VITE_LOGTO_APP_ID`（段階移行用フォールバック）
- `VITE_LOGTO_CALLBACK_PATH`
- `VITE_LOGTO_POST_LOGOUT_REDIRECT_URI`
- `VITE_LOGTO_API_RESOURCE`
- `VITE_LOGTO_ACCOUNT_CENTER_URL`（例: `https://auth.mizzz.jp/account-center`）
- `VITE_LOGTO_ISSUER`
- `VITE_LOGTO_MANAGEMENT_API_ENDPOINT`（default tenant endpoint）
- `VITE_USER_SYNC_ENABLED`（`false` で同期ブリッジ停止）
- `VITE_USER_LIFECYCLE_ONBOARDING_ENABLED`
- `VITE_ONBOARDING_REMINDER_DAYS`

> `VITE_LOGTO_ACCOUNT_CENTER_URL` 未設定時は frontend 側で `VITE_LOGTO_ENDPOINT + /account-center` をフォールバック利用する。

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
| `USER_STATE_RECONCILE_INTERVAL_MIN` | user state 再同期ジョブ間隔（分） | 推奨 |
| `USER_STATE_SYNC_MAX_DRIFT_MINUTES` | state stale 判定の許容ドリフト（分） | 推奨 |
| `REVENUE_EXPORT_MAX_ROWS` | revenue CSV export 上限行数（internal admin 用） | 任意 |
| `BI_DEFAULT_RANGE_DAYS` | internal BI overview/cohort の既定集計期間（日） | 任意 |
| `BI_MAX_FETCH_ROWS` | BI集計時の1ドメインあたり最大取得行数（メモリ保護） | 任意 |
| `BI_ALERT_MIN_VOLUME` | alert/anomaly 判定の最小母数（誤検知抑制） | 任意 |
| `BI_ALERT_DROP_RATIO` | 重要KPI低下を判定する比率閾値（例: 0.20=20%） | 任意 |
| `BI_ALERT_SPIKE_RATIO` | 重要KPI増加を判定する比率閾値（例: 0.35=35%） | 任意 |
| `BI_FORECAST_HORIZON_DAYS` | 短期forecast生成日数 | 任意 |
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

### backend 認可（Logto）詳細
- `LOGTO_ISSUER`
- `LOGTO_JWKS_URI`
- `LOGTO_API_RESOURCE`
- `LOGTO_REQUIRED_SCOPES`
- `LOGTO_MANAGEMENT_API_ENDPOINT`（default tenant endpoint）
- `LOGTO_M2M_APP_ID`
- `LOGTO_M2M_APP_SECRET`
- `LOGTO_USER_SYNC_OPS_TOKEN`（support lookup API 用）
- `USER_LIFECYCLE_GRACE_NOTICE_DAYS`（grace 通知表示のしきい値日数）
- `USER_STATE_RECONCILE_INTERVAL_MIN`
- `USER_STATE_SYNC_MAX_DRIFT_MINUTES`

## 3. GitHub Secrets（推奨一覧）

### Frontend build/deploy
- `VITE_STRAPI_API_URL`
- `VITE_STRAPI_API_TOKEN`
- `VITE_LOGTO_ENDPOINT`
- `VITE_LOGTO_APP_ID_MAIN`
- `VITE_LOGTO_APP_ID_STORE`
- `VITE_LOGTO_APP_ID_FC`
- `VITE_LOGTO_APP_ID`
- `VITE_LOGTO_API_RESOURCE`
- `VITE_LOGTO_ACCOUNT_CENTER_URL`
- `VITE_LOGTO_ISSUER`
- `VITE_LOGTO_MANAGEMENT_API_ENDPOINT`
- `VITE_MEMBERSHIP_STATE_SYNC_INTERVAL_SEC`
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
- `BI_DEFAULT_RANGE_DAYS`
- `BI_MAX_FETCH_ROWS`
- `BI_ALERT_MIN_VOLUME`
- `BI_ALERT_DROP_RATIO`
- `BI_ALERT_SPIKE_RATIO`
- `BI_FORECAST_HORIZON_DAYS`
- `ANALYTICS_IP_HASH_SALT`
- `INQUIRY_NOTIFY_TO`（通知を使う場合）
- SMTP で必要な Secret（`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`）
- `LOGTO_USER_SYNC_OPS_TOKEN`（user lookup API 用。staging/prod で分離）
- `USER_STATE_RECONCILE_INTERVAL_MIN`
- `USER_STATE_SYNC_MAX_DRIFT_MINUTES`

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
- `auth.mizzz.jp` を既に運用している前提で env / docs / UI 導線のみ更新する場合は、**DNS 変更不要**。
- `auth.mizzz.jp` を新規導入する場合のみ CNAME 追加が必要。

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

## 9. Logto custom domain 運用の DNS 注意点
- `auth.mizzz.jp` を新規利用する場合のみ DNS 追加が必要（CNAME）。
- 既に `auth.mizzz.jp` 運用済みで、今回の env / CI / docs 整理だけを実施する場合は **DNS変更不要**。


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


### user-sync 追加メモ（2026-04-18）
- backend の `LOGTO_USER_SYNC_OPS_TOKEN` は runtime secret として扱い、frontend には露出しない。
- `POST /api/user-sync/provision` は Bearer token で認証し、`GET /api/user-sync/support/lookup` は `x-ops-token` で保護する。
- Logto Cloud の Management API は引き続き default tenant endpoint を使い、custom domain (`auth.mizzz.jp`) はエンドユーザー認証 UI 用に限定する。
- 既存 `auth.mizzz.jp` を使う構成では DNS変更不要。

## 9. workflow / playbook automation 追加（2026-04-19）

### backend runtime env
- `PLAYBOOK_APPROVAL_AUDIENCE_THRESHOLD`: audience 規模が閾値以上の場合に approval を強制するための基準値。
- `PLAYBOOK_SAFE_MODE_DEFAULT`: `true` の場合、playbook 実行 API は safe mode を既定で有効化。
- `PLAYBOOK_RETRY_LIMIT`: action retry の最大試行回数（metadata と run 表示で利用）。

### GitHub Secrets / Variables
- 既存 backend デプロイ secret 群に追加して staging/production で環境分離する。
- 実行 token（Logto internal role）と playbook env は責務分離し、同じ secret 値を使い回さない。

### 補足
- 今回の playbook console 追加は既存ドメインと API で完結するため **DNS変更不要**。
