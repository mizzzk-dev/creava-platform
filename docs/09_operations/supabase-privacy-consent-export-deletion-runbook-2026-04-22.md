# Supabase Auth 前提 privacy / consent / export / deletion / retention runbook（2026-04-22）

## 1. 現在のプライバシー設定体験の課題
1. account center / security hub はあるが、privacy / consent / export / deletion の自己管理導線が別々で理解しづらい。
2. 通知許諾（notification）と CRM 配信許諾（crm）が UI 上で近い一方、状態責務が明文化されていない。
3. 退会（membership cancellation）とアカウント削除（deletion）の違いが明示不足。
4. data export が self-service で追跡できず、support 依存になりやすい。
5. support/internal admin が privacy 状態を追う際、security / membership / business state にまたがる確認が必要。

## 2. 情報設計（責務分離）
- 認証: `auth.users`（Supabase Auth）
- ビジネス状態: `app-user`（membershipStatus / entitlementState / subscriptionState / billingState / lifecycleStage）
- privacy/lifecycle 状態: `app-user` の privacy 系フィールド

### 追加した状態
- consent: `consentState`, `notificationConsentState`, `crmConsentState`, `analyticsConsentState`
- privacy summary: `privacySummary`, `privacyNoticeState`, `privacyUpdatedAt`
- export: `dataExportState`, `dataExportRequestState`, `dataExportRequestedAt`, `dataExportReadyAt`
- deletion: `deletionState`, `deletionRequestState`, `deletionRequestedAt`, `deletionConfirmedAt`
- lifecycle/retention: `anonymizationState`, `retentionState`, `retentionReason`, `membershipCancellationState`, `cancellationState`, `legalHoldState`

## 3. self-service API（user-sync 配下）
- `GET /api/user-sync/privacy/summary`
- `POST /api/user-sync/privacy/preferences`
- `POST /api/user-sync/privacy/export-request`
- `POST /api/user-sync/privacy/membership-cancellation`
- `POST /api/user-sync/privacy/deletion-request`

### 注意
- 削除は確認フレーズ `DELETE_MY_ACCOUNT` を必須化。
- deletion は即時削除にせず `cooling_off` へ遷移。
- legal hold が active の場合は retention を優先。

## 4. mypage / privacy center
- `/member` に `PrivacyCenterPanel` を追加。
- 1画面で consent / export / cancellation / deletion の current state を確認可能。
- user-facing 文言で「退会」「解約」「削除」「保持」を分離表示。

## 5. support / internal admin
- `internal summary` で `privacySummary` を返す。
- support は user-facing summary と internal state を分けて確認する。
- privileged action は引き続き internal permission で制御（削除実行自体は次段の queue 化対象）。

## 6. RLS / access / policy 方針
- self-service は本人トークン必須（`verifyAccessToken`）。
- raw security log は引き続き直接公開しない。
- service role が必要な本削除・匿名化処理は backend 側でのみ実行する（frontend 露出禁止）。

## 7. 計測イベント
- `privacy_center_view`
- `consent_settings_view`
- `consent_settings_save`
- `data_export_request_complete`
- `deletion_request_confirm`
- `membership_cancellation_complete`

共通属性として `sourceSite / locale / theme / membershipStatus / lifecycleStage` を可能な範囲で付与する。

## 8. env / secrets 追加方針
### frontend runtime
- `VITE_PRIVACY_CENTER_ENABLED`
- `VITE_PRIVACY_DELETION_CONFIRM_PHRASE`
- `VITE_PRIVACY_EXPORT_EXPIRY_HOURS`

### backend runtime/secrets
- `PRIVACY_EXPORT_EXPIRY_HOURS`
- `PRIVACY_DELETION_COOLING_OFF_DAYS`
- `PRIVACY_RETENTION_DEFAULT_REASON`
- `PRIVACY_REQUIRE_DELETE_CONFIRM_PHRASE`
- `SUPABASE_SERVICE_ROLE_KEY`（backend only）

## 9. local / staging / production 確認手順
1. main/store/fc で login/logout/callback が継続動作。
2. `/member` で privacy summary が表示される。
3. consent 保存時に API で state が更新される。
4. export request / membership cancellation / deletion request が状態遷移する。
5. internal summary から privacy summary を追跡できる。

## 10. よくあるトラブル
- `privacy summary` 取得失敗: app-user が未プロビジョニング。
- deletion request 失敗: 確認フレーズ不一致。
- export state が進まない: queue/worker 未導入（次段対応）。

## 11. 未対応（次PR）
- legal request automation
- anonymization queue
- deletion queue の非同期実行
- consent versioning（規約版数との紐付け）
- retention automation（期間満了の自動遷移）

## 12. 仮定
1. main/store/fc は同一 Supabase Auth project を利用している。
2. app-user が privacy / lifecycle summary の SoT として運用される。
3. immediate hard delete は運用上禁止し、cooling-off + queue 実行に寄せる。
4. order/billing/audit は最小保持が必要で、削除対象から常に除外される場合がある。
