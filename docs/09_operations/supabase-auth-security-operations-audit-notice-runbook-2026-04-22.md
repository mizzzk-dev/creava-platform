# Supabase Auth 前提 認証監査ログ / security notice / suspicious review / support復旧 runbook（2026-04-22）

## 1. 現在の認証監査・復旧運用課題
- これまで `securitySummary` は `app-user` のスナップショット中心で、イベント時系列（いつ/どこで/誰が/何をしたか）の正規化ストアが弱かった。
- `member` 画面の notice / audit は汎用 collection endpoint 依存で、認証操作に直結する event source と分離されていた。
- support/internal admin が suspicious 状態を追う際に、notice 状態と investigation 状態の境界が曖昧になりやすかった。

## 2. 情報設計（責務分離）
- `auth.users`: 認証主体（認証システムの source of truth）。
- `app-user.securitySummary`: ユーザー向けの現在状態サマリー。
- `security-event`: 認証/セキュリティの raw event（監査用）。
- `security-notice`: ユーザーに見せる通知状態（action_required / review_recommended など）。
- `security-investigation`: support/internal admin の調査状態。

### 主な state
- `securityEventType`: login/logout/password reset/email change/MFA/provider/session revoke/reauth/suspicious。
- `securityNoticeState`: none/info/review_recommended/action_required/resolved。
- `suspiciousReviewState`: none/flagged/under_review/user_confirmed/support_reviewed/resolved。
- `investigationState`: not_needed/open/reviewing/resolved/escalated。
- `recoveryState`: none/self_service/support_required/support_in_progress/completed。

## 3. 実装責務
- `/api/user-sync/security/events`:
  - self-service 操作完了時に event を追記。
  - dedupeKey で重複記録を抑止。
- `/api/user-sync/security/overview`:
  - user 向け security summary + recent events + notices を返す。
- `/api/internal/users/:authUserId/security-ops`:
  - internal role で event / notice / investigation をまとめて参照。

## 4. suspicious review 方針（conservative）
- 初期は rule-based で運用し、`mfa_disabled` / `email_change_completed` / `login_failed` 集中時などを review 推奨。
- 断定表現を避け、ユーザーには「確認を推奨」メッセージを表示。

## 5. self-service と support 介在の境界
- self-service:
  - password reset request
  - email change request
  - session revoke
- support 介在:
  - suspiciousReviewState が `under_review`
  - recoveryRecommendationState が `required`
  - investigationState が `escalated`

## 6. RLS / access 方針
- frontend は anon key のみ利用。
- service role は backend のみ（`SUPABASE_SERVICE_ROLE_KEY`）で使用。
- raw `security-event` は user に直接 expose せず、`/user-sync/security/overview` で用途限定表示。
- internal security ops API は `requireInternalPermission` を必須。

## 7. 計測イベント（追加/運用）
- `security_hub_view`
- `recent_security_activity_view`
- `security_notice_view`
- `security_notice_click`
- `suspicious_review_notice_view`
- `suspicious_review_cta_click`
- `password_reset_requested`
- `email_change_requested`
- `session_revoke_completed`
- `support_from_security_notice`
- `support_from_security_hub`

`sourceSite / locale / theme / membershipStatus / lifecycleStage` を付与して評価する。

## 8. GitHub Secrets / runtime env
- frontend runtime:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_SUPABASE_PASSWORD_RESET_REDIRECT_URL`
  - `VITE_SUPABASE_EMAIL_CHANGE_REDIRECT_URL`
  - `VITE_SUPABASE_SECURITY_HUB_PATH`
- backend runtime:
  - `SUPABASE_JWT_ISSUER`
  - `SUPABASE_JWKS_URI`
  - `SUPABASE_SERVICE_ROLE_KEY`（backend only）
  - `SENSITIVE_REAUTH_MAX_AGE_SEC`

## 9. local / staging / production 確認
1. login -> `/user-sync/provision` 後に `security-event(login_success)` が追記される。
2. member 画面で password reset / email change / session revoke を実行し、`security-notice` が作成される。
3. internal admin token で `/internal/users/:authUserId/security-ops` が参照できる。
4. 権限なし token で internal API が拒否される。

## 10. よくあるトラブル
- event が記録されない: bearer token 期限切れ or eventType 不正。
- notice が出ない: `securityNoticeState=none` の event を送っている。
- internal 参照不可: internal permission claim 不足。

## 11. 仮定
- suspicious 判定は現時点で conservative な rule-based（高度スコアリング未導入）。
- passkey / 自動対応フローは次PRで拡張する前提。
- support ツールのケース管理システム連携は未実装で runbook 駆動とする。
