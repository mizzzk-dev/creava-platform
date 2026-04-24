# 環境変数設定手順書（Supabase Auth / user domain 同期対応版）

- 更新日: 2026-04-21
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
| `VITE_AUTH_PROVIDER` | 認証プロバイダ切替（`supabase` 推奨） | 必須 | 必須 | 必須 |
| `VITE_SUPABASE_URL` | Supabase project URL | 必須 | 必須 | 必須 |
| `VITE_SUPABASE_ANON_KEY` | frontend 公開用 anon key | 必須 | 必須 | 必須 |
| `VITE_SUPABASE_OAUTH_DEFAULT_PROVIDER` | 既定 OAuth provider | 任意 | 任意 | 任意 |
| `VITE_SUPABASE_PROJECT_REF` | account center導線や運用表示用 project ref | 任意 | 任意 | 任意 |
| `VITE_SUPABASE_PASSWORD_RESET_REDIRECT_URL` | password reset 完了後の戻り先 | 推奨 | 推奨 | 推奨 |
| `VITE_SUPABASE_EMAIL_CHANGE_REDIRECT_URL` | email change 承認後の戻り先 | 推奨 | 推奨 | 推奨 |
| `VITE_SUPABASE_REAUTH_REDIRECT_URL` | sensitive action 再認証後の戻り先 | 推奨 | 推奨 | 推奨 |
| `VITE_SUPABASE_SECURITY_HUB_PATH` | security hub 既定導線 | 任意 | 任意 | 任意 |
| `VITE_LOGTO_*` | 旧認証互換（移行期間のみ） | 任意 | 任意 | 任意 |
| `VITE_USER_SYNC_ENABLED` | user provisioning bridge の有効化 | 任意 | 任意 | 任意 |
| `VITE_USER_LIFECYCLE_ONBOARDING_ENABLED` | lifecycle/onboarding UI 表示フラグ | 任意 | 推奨 | 推奨 |
| `VITE_NOTIFICATION_CENTER_ENABLED` | cross-site inbox UI の有効化 | 任意 | 推奨 | 推奨 |
| `VITE_NOTIFICATION_IMPORTANT_MAX` | 重要通知の表示上限 | 任意 | 推奨 | 推奨 |
| `VITE_NOTIFICATION_INBOX_PAGE_SIZE` | inbox 取得件数（frontend） | 任意 | 推奨 | 推奨 |
| `VITE_NOTIFICATION_DIGEST_DEFAULT` | digest 既定（daily/weekly） | 任意 | 任意 | 推奨 |
| `VITE_SUPPORT_CENTER_HISTORY_PAGE_SIZE` | support hub の case history 表示件数 | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_CENTER_SUGGESTION_MAX` | self-service article 提案件数 | 任意 | 推奨 | 推奨 |
| `VITE_HELP_SEARCH_MIN_QUERY_LENGTH` | help center 検索ログを送る最小文字数 | 任意 | 推奨 | 推奨 |
| `VITE_HELP_SEARCH_DEBOUNCE_MS` | help center 検索ログ送信の debounce | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_LOCALE_DEFAULT` | support locale の既定値（`ja` など） | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_LOCALE_FALLBACK_CHAIN` | locale fallback 優先順（例: `ja,en,ko`） | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_LOCALE_MIN_COVERAGE` | locale coverage を healthy 判定する閾値 | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_TRANSLATION_QA_ENABLED` | translation QA 表示/集計の有効化 | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_LOCALE_ANALYTICS_ENABLED` | locale effectiveness 計測イベント送信を有効化 | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_TRANSLATION_MEMORY_MIN_MATCH_SCORE` | translation memory の再利用候補とする最小一致率 | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_TRANSLATION_WORKFLOW_AUTOMATION_ENABLED` | localization workflow 自動キュー連携フラグ | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_GLOSSARY_DRIFT_ALERT_THRESHOLD` | glossary drift alert 閾値（0-1） | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_LOCALE_RETRIEVAL_LOW_CONFIDENCE_THRESHOLD` | locale retrieval low confidence 閾値（0-1） | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_REGIONAL_POLICY_TEMPLATE_DEFAULT` | regional policy template の既定キー | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_TRANSLATION_REUSE_HIGH_THRESHOLD` | translation reuse coverage を high 判定する閾値（0-1） | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_LOCALE_RANKING_TUNING_TRIGGER` | locale ranking tuning の起動条件キー | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_REGIONAL_POLICY_TEMPLATE_MIN_COVERAGE` | regional policy template coverage の最小目標値（0-1） | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_POLICY_GOVERNANCE_ENABLED` | support policy governance UI/連携の有効化 | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_GOVERNANCE_GUARDRAIL_WARN_THRESHOLD` | governance guardrail warning 判定閾値（0-1） | 任意 | 推奨 | 推奨 |
| `VITE_SUPPORT_GOVERNANCE_GUARDRAIL_BREACH_THRESHOLD` | governance guardrail breach 判定閾値（0-1） | 任意 | 推奨 | 推奨 |
| `VITE_ONBOARDING_REMINDER_DAYS` | onboarding 再表示までの日数 | 任意 | 任意 | 推奨 |
| `VITE_MEMBERSHIP_STATE_SYNC_INTERVAL_SEC` | frontend で state summary を再同期する間隔（秒） | 任意 | 推奨 | 推奨 |
| `VITE_RENEWAL_REMINDER_DAYS` | renewal前 notice 表示開始日数 | 任意 | 推奨 | 推奨 |
| `VITE_GRACE_RECOVERY_DAYS` | grace recovery 導線の既定表示日数 | 任意 | 推奨 | 推奨 |
| `VITE_WINBACK_WINDOW_DAYS` | expired/canceled 向け win-back 導線表示日数 | 任意 | 推奨 | 推奨 |
| `VITE_LIFECYCLE_MESSAGE_COOLDOWN_HOURS` | lifecycle message の最小再送間隔 | 任意 | 推奨 | 推奨 |
| `VITE_MEMBER_BENEFIT_HUB_ENABLED` | member benefit hub UI の有効化 | 任意 | 推奨 | 推奨 |
| `VITE_MEMBER_VALUE_PROMPT_COOLDOWN_HOURS` | member value prompt の再表示クールダウン | 任意 | 推奨 | 推奨 |
| `VITE_MEMBER_EARLY_ACCESS_TEASER_DAYS` | 先行公開 teaser の表示開始日数 | 任意 | 推奨 | 推奨 |
| `VITE_MEMBER_GRACE_VALUE_MESSAGE_DAYS` | grace向け価値訴求ブロック表示日数 | 任意 | 推奨 | 推奨 |
| `VITE_MEMBER_RANK_MODEL_VERSION` | ランク計算ルールのバージョン | 任意 | 推奨 | 推奨 |
| `VITE_MEMBER_MISSION_DEFAULT_ENABLED` | ミッション導線の既定有効化 | 任意 | 推奨 | 推奨 |
| `VITE_MEMBER_PROGRESS_HUB_ENABLED` | progress hub UI 表示フラグ | 任意 | 推奨 | 推奨 |
| `VITE_MEMBER_NEXT_UNLOCK_HINT_ENABLED` | 次解放ヒント表示フラグ | 任意 | 推奨 | 推奨 |
| `VITE_MEMBER_PERSONALIZED_PERK_ENABLED` | パーソナライズ特典表示フラグ | 任意 | 推奨 | 推奨 |
| `VITE_SHOPIFY_*` | store 商品取得 | 任意 | 必須 | 必須 |
| `VITE_STRIPE_PUBLISHABLE_KEY` | 決済公開キー | 任意 | 必須 | 必須 |
| `VITE_PERSONALIZATION_MAX_HISTORY` | 閲覧履歴の保存上限 | 任意 | 任意 | 任意 |
| `VITE_PERSONALIZATION_MAX_FAVORITES` | お気に入り保存上限 | 任意 | 任意 | 任意 |
| `VITE_ANALYTICS_OPS_ENDPOINT` | 主要イベントをStrapiへ保存するエンドポイント | 任意 | 推奨 | 推奨 |
| `VITE_PREVIEW_VERIFY_ENDPOINT` | backend preview verify endpoint（推奨: `/api/cms-sync/preview/verify`） | 推奨 | 推奨 | 推奨 |
| `VITE_PREVIEW_SECRET` | preview secret fallback（段階移行用。最終的に未設定推奨） | 任意 | 任意 | 任意 |

### frontend 認証（Supabase）詳細
- `VITE_AUTH_PROVIDER=supabase`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_OAUTH_DEFAULT_PROVIDER`
- `VITE_SUPABASE_PROJECT_REF`
- `VITE_SUPABASE_PASSWORD_RESET_REDIRECT_URL`
- `VITE_SUPABASE_EMAIL_CHANGE_REDIRECT_URL`
- `VITE_SUPABASE_REAUTH_REDIRECT_URL`
- `VITE_SUPABASE_SECURITY_HUB_PATH`

> `SUPABASE_SERVICE_ROLE_KEY` は backend のみで使用し、frontend に設定しないこと。

### frontend 認証（Logto, 互換）詳細
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
| `BENEFIT_PROMPT_COOLDOWN_HOURS` | benefit prompt 再送間隔（時間） | 推奨 |
| `BENEFIT_PROMPT_DAILY_CAP` | benefit prompt 1日上限回数 | 推奨 |
| `EARLY_ACCESS_PREVIEW_DAYS` | early access preview の既定日数 | 推奨 |
| `EARLY_ACCESS_PUBLIC_RELEASE_BUFFER_HOURS` | public release 切替バッファ（時間） | 任意 |
| `BENEFIT_TEASER_DEDUPE_HOURS` | teaser の重複表示抑制間隔（時間） | 推奨 |
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
| `INQUIRY_FORECAST_LOOKBACK_DAYS` | support capacity forecast の基準期間（日） | 推奨 |
| `INQUIRY_FORECAST_SURGE_RATIO` | 当日件数が baseline 比で surge 判定される比率 | 推奨 |
| `INQUIRY_COVERAGE_CASES_PER_ASSIGNEE` | assignee 1人あたりの標準カバレッジ件数 | 推奨 |
| `INQUIRY_SURGE_HIGH_PRIORITY_RATIO` | unresolved 内の high/urgent 比率で surge 補正する閾値 | 任意 |
| `INQUIRY_QA_REVIEW_QUEUE_DAYS` | QA review queue の標準対象期間（日） | 推奨 |
| `INQUIRY_QA_LOW_SCORE_THRESHOLD` | QA低品質判定閾値（1-5） | 推奨 |
| `INQUIRY_CSAT_ENABLED` | CSAT 収集機能有効化 (`true/false`) | 推奨 |
| `INQUIRY_CSAT_AUTO_SEND_ON_RESOLVE` | resolve 時に CSAT 送信状態へ遷移 | 任意 |
| `INQUIRY_CSAT_LOW_SCORE_THRESHOLD` | low CSAT 判定閾値（1-5） | 推奨 |
| `INQUIRY_REOPEN_MONITOR_DAYS` | reopen/repeat contact を監視する期間（日） | 推奨 |
| `INQUIRY_KNOWLEDGE_GAP_MIN_CASES` | knowledge gap 疑いの最小件数 | 推奨 |
| `INQUIRY_KNOWLEDGE_NO_RESULT_MIN_DAILY` | no-result query を gap 候補化する最小日次件数 | 任意 |
| `INQUIRY_KNOWLEDGE_EFFECTIVENESS_LOOKBACK_DAYS` | article effectiveness 集計期間（日） | 任意 |
| `INQUIRY_TRANSLATION_MEMORY_MIN_REUSE` | translation memory 再利用 summary の最小件数 | 任意 |
| `INQUIRY_GLOSSARY_DRIFT_ALERT_THRESHOLD` | glossary drift を alert 化する閾値（0-1） | 任意 |
| `INQUIRY_LOCALE_RETRIEVAL_WEAK_THRESHOLD` | locale retrieval weak 判定閾値（0-1） | 任意 |
| `INQUIRY_REGIONAL_POLICY_TEMPLATE_DEFAULT` | regional policy template の backend 既定キー | 任意 |
| `INQUIRY_TRANSLATION_REUSE_LOW_THRESHOLD` | translation reuse を low 判定する閾値（0-1） | 任意 |
| `INQUIRY_LOCALE_RANKING_TUNING_THRESHOLD` | locale ranking tuning が必要な閾値（0-1） | 任意 |
| `INQUIRY_REGIONAL_POLICY_TEMPLATE_MIN_COVERAGE` | regional policy template coverage の最小目標値（0-1） | 任意 |
| `SUPPORT_POLICY_GOVERNANCE_ENABLED` | support policy governance control plane を有効化 | 任意 |
| `SUPPORT_POLICY_GUARDRAIL_BREACH_THRESHOLD` | support policy guardrail breach 判定閾値（0-1） | 任意 |
| `SUPPORT_POLICY_GOVERNANCE_AUDIT_WINDOW_HOURS` | governance audit 集計対象時間（h） | 任意 |
| `INQUIRY_COACHING_SUGGESTION_ENABLED` | coaching suggestion の生成有効化 | 推奨 |
| `INQUIRY_TEMPLATE_OVERUSE_RATIO` | template overuse 判定の比率閾値（0-1） | 任意 |
| `INQUIRY_MY_HISTORY_PAGE_MAX` | `/inquiry-submissions/me/history` の最大 pageSize | 推奨 |
| `INQUIRY_MY_SUMMARY_MAX_ROWS` | `/inquiry-submissions/me/summary` 集計上限 | 推奨 |
| `INQUIRY_MAILBOX_WEBHOOK_SECRET` | mailbox inbound/delivery webhook 保護シークレット | 必須 |
| `STRAPI_PUBLISH_WEBHOOK_SECRET` | Strapi publish webhook 検証シークレット（`x-strapi-webhook-secret`） | 必須 |
| `PREVIEW_SHARED_SECRET` | preview verify endpoint 用シークレット | 必須 |
| `CMS_REVALIDATE_OPS_TOKEN` | manual revalidate endpoint 用 ops token | 必須 |
| `STRAPI_SCHEMA_VERSION` | 現在運用中の schema バージョン識別子（runbook / migration と突合） | 推奨 |
| `STRAPI_SCHEMA_COMPAT_MODE` | 互換 mapper を有効化する切替フラグ（段階移行時） | 推奨 |
| `STRAPI_SCHEMA_MIGRATION_DRY_RUN` | migration script の dry-run 実行可否 | 推奨 |
| `STRAPI_SCHEMA_MIGRATION_BATCH_SIZE` | migration/backfill のバッチ件数 | 推奨 |
| `STRAPI_RELATION_POPULATE_DEPTH_MAX` | relation の最大 populate 深度ガード | 任意 |
| `INQUIRY_MAILBOX_PROVIDER` | mailbox bridge プロバイダ名（監査ログ用） | 任意 |
| `INQUIRY_MAILBOX_DEFAULT_FROM` | support outbound メール送信元 | 推奨 |
| `INQUIRY_MAILBOX_DEFAULT_REPLY_TO` | user reply のデフォルト返信先 | 推奨 |
| `INQUIRY_MAILBOX_INBOUND_DOMAIN` | inbound reply 受信ドメイン | 推奨 |
| `INQUIRY_MAILBOX_ATTACHMENT_MAX_BYTES` | mailbox 添付の受信サイズ上限 | 推奨 |
| `INQUIRY_MAILBOX_ATTACHMENT_MAX_FILES` | mailbox 添付の受信件数上限 | 推奨 |
| `UPLOAD_MAX_FILE_SIZE_BYTES` | Upload Plugin サイズ上限 | 必須 |
| `LIFECYCLE_EMAIL_FROM` | ライフサイクル配信の送信元メール（SMTP_FROMを上書きする場合） | 任意 |
| `NOTIFICATION_CENTER_ENABLED` | notification inbox API の有効化 | 推奨 |
| `NOTIFICATION_INBOX_PAGE_SIZE` | inbox API 返却上限 | 推奨 |
| `NOTIFICATION_IMPORTANT_NOTICE_DAILY_CAP` | 重要通知の日次上限 | 推奨 |
| `NOTIFICATION_CAMPAIGN_DAILY_CAP` | campaign 通知の日次上限 | 推奨 |
| `NOTIFICATION_DEDUPE_WINDOW_HOURS` | 同種通知の重複抑制時間 | 推奨 |
| `NOTIFICATION_DIGEST_HOUR_UTC` | digest 送信のUTC時刻 | 任意 |
| `NOTIFICATION_DELIVERY_BATCH_SIZE` | 1バッチ配信件数 | 任意 |
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
- `BENEFIT_PROMPT_COOLDOWN_HOURS`
- `BENEFIT_PROMPT_DAILY_CAP`
- `EARLY_ACCESS_PREVIEW_DAYS`
- `EARLY_ACCESS_PUBLIC_RELEASE_BUFFER_HOURS`
- `BENEFIT_TEASER_DEDUPE_HOURS`
- `MEMBER_RANK_MODEL_VERSION`
- `MISSION_DEFAULT_ENABLED`
- `MISSION_PROGRESS_SYNC_INTERVAL_MIN`
- `ACHIEVEMENT_HIGHLIGHT_ENABLED`
- `PERK_UNLOCK_MESSAGE_COOLDOWN_HOURS`

### backend 認可（Supabase）詳細
- `AUTH_PROVIDER`（`supabase` または移行期 `dual`）
- `SUPABASE_JWT_ISSUER`
- `SUPABASE_JWKS_URI`
- `SUPABASE_JWT_AUDIENCE`
- `SUPABASE_SERVICE_ROLE_KEY`（trusted server 限定。frontend 露出禁止）
- `SENSITIVE_REAUTH_MAX_AGE_SEC`（sensitive action を許可する認証 freshness 秒数）
- `PERSONALIZED_PERK_ENABLED`
- `RANK_GRACE_RETENTION_DAYS`
- `NOTIFICATION_CENTER_ENABLED`
- `NOTIFICATION_INBOX_PAGE_SIZE`
- `NOTIFICATION_IMPORTANT_NOTICE_DAILY_CAP`
- `NOTIFICATION_CAMPAIGN_DAILY_CAP`
- `NOTIFICATION_DEDUPE_WINDOW_HOURS`
- `NOTIFICATION_DIGEST_HOUR_UTC`
- `NOTIFICATION_DELIVERY_BATCH_SIZE`
- `INTERNAL_ADMIN_APPROVAL_REQUIRED_ACTIONS`
- `INTERNAL_ADMIN_APPROVAL_MIN_ROLE`
- `INTERNAL_ADMIN_USER360_TIMELINE_LIMIT`
- `INTERNAL_ADMIN_AUDIT_RETENTION_DAYS`

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
- `VITE_MEMBER_BENEFIT_HUB_ENABLED`
- `VITE_MEMBER_VALUE_PROMPT_COOLDOWN_HOURS`
- `VITE_MEMBER_EARLY_ACCESS_TEASER_DAYS`
- `VITE_MEMBER_GRACE_VALUE_MESSAGE_DAYS`
- `VITE_MEMBER_RANK_MODEL_VERSION`
- `VITE_MEMBER_MISSION_DEFAULT_ENABLED`
- `VITE_MEMBER_PROGRESS_HUB_ENABLED`
- `VITE_MEMBER_NEXT_UNLOCK_HINT_ENABLED`
- `VITE_MEMBER_PERSONALIZED_PERK_ENABLED`
- `VITE_NOTIFICATION_CENTER_ENABLED`
- `VITE_NOTIFICATION_IMPORTANT_MAX`
- `VITE_NOTIFICATION_INBOX_PAGE_SIZE`
- `VITE_NOTIFICATION_DIGEST_DEFAULT`
- `VITE_SUPPORT_CENTER_HISTORY_PAGE_SIZE`
- `VITE_SUPPORT_CENTER_SUGGESTION_MAX`
- `VITE_SUPPORT_LOCALE_DEFAULT`
- `VITE_SUPPORT_LOCALE_FALLBACK_CHAIN`
- `VITE_SUPPORT_LOCALE_MIN_COVERAGE`
- `VITE_SUPPORT_TRANSLATION_QA_ENABLED`
- `VITE_SUPPORT_LOCALE_ANALYTICS_ENABLED`
- `VITE_SUPPORT_TRANSLATION_MEMORY_MIN_MATCH_SCORE`
- `VITE_SUPPORT_TRANSLATION_WORKFLOW_AUTOMATION_ENABLED`
- `VITE_SUPPORT_TRANSLATION_REUSE_HIGH_THRESHOLD`
- `VITE_SUPPORT_LOCALE_RANKING_TUNING_TRIGGER`
- `VITE_SUPPORT_REGIONAL_POLICY_TEMPLATE_MIN_COVERAGE`
- `VITE_SUPPORT_GLOSSARY_DRIFT_ALERT_THRESHOLD`
- `VITE_SUPPORT_LOCALE_RETRIEVAL_LOW_CONFIDENCE_THRESHOLD`
- `VITE_SUPPORT_REGIONAL_POLICY_TEMPLATE_DEFAULT`
- `VITE_SUPPORT_POLICY_GOVERNANCE_ENABLED`
- `VITE_SUPPORT_GOVERNANCE_GUARDRAIL_WARN_THRESHOLD`
- `VITE_SUPPORT_GOVERNANCE_GUARDRAIL_BREACH_THRESHOLD`
- `VITE_STATUS_FETCH_TIMEOUT_MS`
- `VITE_STATUS_FETCH_RETRY_COUNT`
- `VITE_INTERNAL_ADMIN_CONSOLE_ENABLED`
- `VITE_INTERNAL_ADMIN_USER360_TIMELINE_LIMIT`
- `VITE_SHOPIFY_STORE_DOMAIN`
- `VITE_SHOPIFY_STOREFRONT_TOKEN`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_PREVIEW_VERIFY_ENDPOINT`
- `VITE_PREVIEW_SECRET`（fallback only）
- FTP 系 (`FTP_SERVER_*`, `FTP_USERNAME_*`, `FTP_PASSWORD_*`, `FTP_SERVER_DIR_*`)

### Backend deploy/runtime
- `STRAPI_DEPLOY_TOKEN`
- `PREVIEW_SHARED_SECRET`（`/api/cms-sync/preview/verify` 用）
- `STRAPI_PUBLISH_WEBHOOK_SECRET`（`/api/cms-sync/strapi-webhook` 用）
- `CMS_REVALIDATE_OPS_TOKEN`（`/api/cms-sync/revalidate` 用）
- `INQUIRY_IP_HASH_SALT`
- `INQUIRY_OPS_TOKEN`
- `INQUIRY_MY_HISTORY_PAGE_MAX`
- `INQUIRY_MY_SUMMARY_MAX_ROWS`
- `INQUIRY_TRANSLATION_MEMORY_MIN_REUSE`
- `INQUIRY_TRANSLATION_REUSE_LOW_THRESHOLD`
- `INQUIRY_LOCALE_RANKING_TUNING_THRESHOLD`
- `INQUIRY_REGIONAL_POLICY_TEMPLATE_MIN_COVERAGE`
- `INQUIRY_GLOSSARY_DRIFT_ALERT_THRESHOLD`
- `INQUIRY_LOCALE_RETRIEVAL_WEAK_THRESHOLD`
- `INQUIRY_REGIONAL_POLICY_TEMPLATE_DEFAULT`
- `SUPPORT_POLICY_GOVERNANCE_ENABLED`
- `SUPPORT_POLICY_GUARDRAIL_BREACH_THRESHOLD`
- `SUPPORT_POLICY_GOVERNANCE_AUDIT_WINDOW_HOURS`
- `ANALYTICS_OPS_TOKEN`
- `BI_DEFAULT_RANGE_DAYS`
- `BI_MAX_FETCH_ROWS`
- `BI_ALERT_MIN_VOLUME`
- `BI_ALERT_DROP_RATIO`
- `BI_ALERT_SPIKE_RATIO`
- `BI_FORECAST_HORIZON_DAYS`
- `ANALYTICS_IP_HASH_SALT`
- `INQUIRY_NOTIFY_TO`（通知を使う場合）
- `INQUIRY_MAILBOX_WEBHOOK_SECRET`
- `INQUIRY_MAILBOX_DEFAULT_FROM`
- `INQUIRY_MAILBOX_DEFAULT_REPLY_TO`
- `INQUIRY_MAILBOX_INBOUND_DOMAIN`
- SMTP で必要な Secret（`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`）
- `LOGTO_USER_SYNC_OPS_TOKEN`（user lookup API 用。staging/prod で分離）
- `USER_STATE_RECONCILE_INTERVAL_MIN`
- `USER_STATE_SYNC_MAX_DRIFT_MINUTES`
- `BENEFIT_PROMPT_COOLDOWN_HOURS`
- `BENEFIT_PROMPT_DAILY_CAP`
- `EARLY_ACCESS_PREVIEW_DAYS`
- `EARLY_ACCESS_PUBLIC_RELEASE_BUFFER_HOURS`
- `BENEFIT_TEASER_DEDUPE_HOURS`
- `MEMBER_RANK_MODEL_VERSION`
- `MISSION_DEFAULT_ENABLED`
- `MISSION_PROGRESS_SYNC_INTERVAL_MIN`
- `ACHIEVEMENT_HIGHLIGHT_ENABLED`
- `INTERNAL_ADMIN_APPROVAL_REQUIRED_ACTIONS`
- `INTERNAL_ADMIN_APPROVAL_MIN_ROLE`
- `INTERNAL_ADMIN_USER360_TIMELINE_LIMIT`
- `INTERNAL_ADMIN_AUDIT_RETENTION_DAYS`
- `PERK_UNLOCK_MESSAGE_COOLDOWN_HOURS`
- `PERSONALIZED_PERK_ENABLED`
- `RANK_GRACE_RETENTION_DAYS`
- `NOTIFICATION_CENTER_ENABLED`
- `NOTIFICATION_INBOX_PAGE_SIZE`
- `NOTIFICATION_IMPORTANT_NOTICE_DAILY_CAP`
- `NOTIFICATION_CAMPAIGN_DAILY_CAP`
- `NOTIFICATION_DEDUPE_WINDOW_HOURS`
- `NOTIFICATION_DIGEST_HOUR_UTC`
- `NOTIFICATION_DELIVERY_BATCH_SIZE`

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
5. mailbox bridge を有効化する場合は `INQUIRY_MAILBOX_WEBHOOK_SECRET` を設定し、provider 側 webhook ヘッダ `x-mailbox-webhook-secret` と一致させる。

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
- `OPS_STALE_THRESHOLD_HOURS`: operations dashboard で stale summary を判定する閾値時間（既定 6h）。
- `OPS_INCIDENT_STALE_HOURS`: incident dashboard で stale incident を判定する閾値時間（既定 24h）。
- `STATUS_PUBLIC_HISTORY_LIMIT`: status page に返す公開済み incident/maintenance/postmortem summary の最大件数（既定 10）。
- `STATUS_PUBLISH_REQUIRE_APPROVAL`: status/maintenance/postmortem publish に approval を要求するか（既定 true）。
- `OPS_ALERT_COOLDOWN_MINUTES`: scheduled check の alert 重複抑制 cooldown（既定 30m）。
- `OPS_BATCH_MAX_TARGETS`: batch safe ops の最大対象件数（既定 500）。
- `OPS_APPROVAL_EXPIRE_HOURS`: approval の有効期限（既定 48h）。

### GitHub Secrets / Variables
- 既存 backend デプロイ secret 群に追加して staging/production で環境分離する。
- 実行 token（Logto internal role）と playbook env は責務分離し、同じ secret 値を使い回さない。

### 補足
- 今回の playbook console 追加は既存ドメインと API で完結するため **DNS変更不要**。

## 10. release management / rollback / parity 追加（2026-04-22）

### backend runtime env
- `RELEASE_FREEZE_ENABLED`: freeze を強制するか（既定 `false`）。
- `RELEASE_FREEZE_CALENDAR`: freeze 期間を JSON で定義（例: `[{\"from\":\"2026-12-25T00:00:00Z\",\"to\":\"2026-12-26T12:00:00Z\",\"reason\":\"year-end freeze\"}]`）。
- `RELEASE_PARITY_STRICT_MODE`: parity drift がある場合に execute を block するか（既定 `true`）。
- `RELEASE_PARITY_REQUIRED_ENVIRONMENTS`: parity 対象環境（例: `preview,staging,production`）。
- `RELEASE_MIGRATION_DESTRUCTIVE_REQUIRE_APPROVAL`: destructive_like migration の追加承認を必須化（既定 `true`）。
- `RELEASE_ROLLBACK_REQUIRE_APPROVAL`: rollback execute に承認を要求するか（既定 `true`）。
- `RELEASE_VERIFICATION_REQUIRED`: rollout complete 前に verification 完了を必須化するか（既定 `true`）。
- `RELEASE_PUBLIC_NOTE_REQUIRE_APPROVAL`: public release note publish に承認を要求するか（既定 `true`）。
- `RELEASE_DIGEST_ENABLED`: release digest の集約出力を有効化するか（既定 `false`）。

### GitHub Secrets / Variables
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（frontend に露出しない）
- `RELEASE_REQUIRED_APPROVER_IDS`（例: `ops-lead,release-manager`）
- `RELEASE_FREEZE_DEFAULT_WINDOW`（workflow 用 freeze 既定値）

### 補足
- runtime env と CI secrets の責務を分離し、同じキーの使い回しを避ける。
- local / staging / production で parity check の期待値が異なるため、drift 許容条件は docs に明記する。

## 6. runtime exposure control / feature flag 拡張（2026-04-22）

### frontend
- `VITE_RUNTIME_EXPOSURE_CONTROL_ENABLED`: runtime exposure control UI を有効化。
- `VITE_FLAG_DASHBOARD_ENABLED`: internal admin 上の flag dashboard 表示フラグ。
- `VITE_FLAG_EVALUATION_CACHE_TTL_SEC`: evaluation summary の client cache TTL。
- `VITE_FLAG_KILL_SWITCH_CONFIRM_REQUIRED`: kill switch 実行時の confirm 強制。

### backend
- `FEATURE_FLAG_CONTROL_PLANE_ENABLED`: backend 側 flag control API の有効化。
- `FLAG_EVALUATION_CACHE_TTL_SEC`: evaluation result cache TTL。
- `FLAG_DEFAULT_ROLLOUT_PERCENTAGE`: staged exposure の初期値。
- `FLAG_KILL_SWITCH_REQUIRE_APPROVAL`: kill switch 実行前に approval を要求するか。
- `FLAG_KILL_SWITCH_MAX_LATENCY_MS`: kill switch 反映遅延の許容値。
- `FLAG_AUDIENCE_RULESET_VERSION`: audience 評価ルールセットのバージョン。
- `EXPERIMENT_ASSIGNMENT_STICKY_DAYS`: assignment を sticky とみなす日数。

### 運用注意
- `SUPABASE_SERVICE_ROLE_KEY` は backend/trusted server 以外に設定しない。
- release dashboard 用変数と flag dashboard 用変数は分離し、責務を混在させない。

## 11. analytics foundation / attribution / experiment measurement 追加（2026-04-22）

### frontend runtime env
- `VITE_GA_MEASUREMENT_ID`: GA4 measurement ID（`G-XXXXXXXXXX`）。
- `VITE_GTM_CONTAINER_ID`: GTM container ID（`GTM-XXXXXXX`）。
- `VITE_ANALYTICS_DEBUG_MODE`: debug view / preview 時の補助フラグ（本番は false 推奨）。
- `VITE_ANALYTICS_CONSENT_MODE`: consent mode のバージョン（現行 `v2`）。
- `VITE_ANALYTICS_FOUNDATION_ENABLED`: cross-site analytics foundation を有効化。
- `VITE_ANALYTICS_TAXONOMY_VERSION`: event taxonomy の運用バージョン。
- `VITE_ANALYTICS_SESSION_TIMEOUT_MINUTES`: session 境界判定に使う閾値。
- `VITE_ANALYTICS_REQUIRED_EVENT_STREAM`: 必須イベント（product/security/ops）の stream 定義。
- `VITE_ANALYTICS_OPTIONAL_EVENT_STREAM`: consent 依存イベント（marketing/product 改善）の stream 定義。
- `VITE_ANALYTICS_ATTRIBUTION_MODEL`: attribution モデル（初期は `last_touch`）。
- `VITE_ANALYTICS_FUNNEL_STRICT_MODE`: funnel stage の厳格判定。
- `VITE_ANALYTICS_EXPERIMENT_TRACKING_ENABLED`: exposure/outcome 計測の有効化。
- `VITE_ANALYTICS_OBSERVABILITY_ENABLED`: duplicate/schema drift 可視化の有効化。

### backend runtime env
- `ANALYTICS_FOUNDATION_ENABLED`: ingestion/summary pipeline の有効化。
- `ANALYTICS_TAXONOMY_VERSION`: backend 側 taxonomy バージョン。
- `ANALYTICS_ATTRIBUTION_MODEL`: attribution 集計モデル。
- `ANALYTICS_DEDUPE_WINDOW_SECONDS`: duplicate 判定 window。
- `ANALYTICS_INGEST_REQUIRED_CONSENT_EVENTS`: consent 必須イベント群。
- `ANALYTICS_INGEST_REQUIRED_OPERATIONAL_EVENTS`: consent 非依存の必須運用イベント群。
- `ANALYTICS_SCHEMA_DRIFT_ALERT_THRESHOLD`: schema drift alert の閾値。
- `ANALYTICS_DUPLICATE_ALERT_THRESHOLD`: duplicate alert の閾値。
- `ANALYTICS_LATE_EVENT_THRESHOLD_MINUTES`: late event 判定。
- `ANALYTICS_PIPELINE_REPLAY_GUARD_ENABLED`: replay guard の有効化。
- `ANALYTICS_SUMMARY_REFRESH_INTERVAL_MIN`: summary refresh 間隔。
- `ANALYTICS_RAW_RETENTION_DAYS`: raw event 保持日数。
- `ANALYTICS_DERIVED_RETENTION_DAYS`: derived summary 保持日数。

### GitHub Secrets / Variables
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（frontend へ露出しない）
- `ANALYTICS_OPS_TOKEN`
- `ANALYTICS_IP_HASH_SALT`
- `ANALYTICS_TAXONOMY_VERSION`
- `VITE_GA_MEASUREMENT_ID`
- `VITE_GTM_CONTAINER_ID`

### 運用注意
- `auth.users` を analytics business state の source とせず、app 側 user domain + summary を参照する。
- release dashboard / flag dashboard / analytics dashboard の責務を分離する。
- raw event と KPI/derived metric/attribution result を混同しない。

## 8. analytics ops 拡張変数（BigQuery / Looker Studio / Clarity / anomaly）

### frontend
- `VITE_CLARITY_PROJECT_ID`: Clarity project ID。
- `VITE_CLARITY_SAMPLE_RATE`: replay 収集率（0〜1）。
- `VITE_CLARITY_MASKING_MODE`: `strict` / `balanced`。既定は `strict` 推奨。
- `VITE_CLARITY_ALLOWED_PATHS`: replay/heatmap 対象パス（カンマ区切り）。
- `VITE_ANALYTICS_ALERT_WEBHOOK_URL`: frontend から alert gateway を叩く場合のURL（通常は未使用）。
- `VITE_ANALYTICS_ALERT_MIN_SESSIONS`: alert 判定の最小セッション数。
- `VITE_ANALYTICS_ALERT_DROP_THRESHOLD`: 低下 alert 閾値（例: `0.3` = 30%）。
- `VITE_ANALYTICS_ALERT_SPIKE_THRESHOLD`: 増加 alert 閾値（例: `0.45` = 45%）。
- `VITE_ANALYTICS_ALERT_COOLDOWN_MINUTES`: alert 再通知間隔。
- `VITE_ANALYTICS_WEEKLY_REPORT_DAY`: 週次レポート作成曜日（`mon` など）。
- `VITE_ANALYTICS_MONTHLY_REPORT_DAY`: 月次レポート作成日（`1` など）。
- `VITE_LOOKER_STUDIO_DASHBOARD_URL`: 統合 dashboard URL（運用者リンク）。
- `VITE_SEARCH_CONSOLE_PROPERTY_MAIN`: main 用 Search Console property。
- `VITE_SEARCH_CONSOLE_PROPERTY_STORE`: store 用 Search Console property。
- `VITE_SEARCH_CONSOLE_PROPERTY_FC`: fc 用 Search Console property。

### backend
- `ANALYTICS_BIGQUERY_EXPORT_ENABLED`: BigQuery export の有効化。
- `ANALYTICS_BIGQUERY_PROJECT_ID`: BigQuery project ID。
- `ANALYTICS_BIGQUERY_DATASET`: export 先 dataset。
- `ANALYTICS_BIGQUERY_LOCATION`: dataset location（例: `asia-northeast1`）。
- `ANALYTICS_BIGQUERY_SERVICE_ACCOUNT`: export 実行権限を持つ service account。
- `ANALYTICS_BIGQUERY_EXPORT_SCHEDULE_CRON`: export / sync バッチの cron。
- `ANALYTICS_LOOKER_STUDIO_MAIN_URL`: main dashboard URL。
- `ANALYTICS_LOOKER_STUDIO_STORE_URL`: store dashboard URL。
- `ANALYTICS_LOOKER_STUDIO_FC_URL`: fc dashboard URL。
- `ANALYTICS_LOOKER_STUDIO_UNIFIED_URL`: 統合 dashboard URL。
- `ANALYTICS_CLARITY_ENABLED`: Clarity 連携の有効化。
- `ANALYTICS_CLARITY_PROJECT_MAIN`: main 用 Clarity project ID。
- `ANALYTICS_CLARITY_PROJECT_STORE`: store 用 Clarity project ID。
- `ANALYTICS_CLARITY_PROJECT_FC`: fc 用 Clarity project ID。
- `ANALYTICS_ANOMALY_ALERT_WEBHOOK`: anomaly 通知先 webhook。
- `ANALYTICS_ANOMALY_ALERT_CHANNEL`: 通知チャネル識別子（`analytics-ops` など）。
- `ANALYTICS_ANOMALY_ALERT_COOLDOWN_MINUTES`: anomaly alert 再通知間隔。
- `ANALYTICS_ANOMALY_MIN_SESSIONS`: anomaly 判定の最小セッション数。
- `ANALYTICS_ANOMALY_CONVERSION_DROP_RATIO`: CVR 低下判定閾値。
- `ANALYTICS_ANOMALY_ERROR_SPIKE_RATIO`: error 増加判定閾値。
- `ANALYTICS_INTERNAL_HOST_PATTERNS`: internal / preview 除外ホスト判定。
