# Supabase Auth 前提 統一アカウントセンター / 設定ハブ runbook（2026-04-21）

## 1. 現在の課題（現状確認）
1. `main/store/fc` の入口は複数ある一方、セキュリティ導線が mypage 上で明示不足。
2. account center 文言が Logto 前提で、Supabase Auth 運用との整合が弱い。
3. 通知設定は存在するが `notification_settings_view/save` など改善計測イベントが不足。
4. password reset / email change の self-service 導線が UI 上で分散し、support 依存が発生しやすい。
5. env で reset/email-change redirect の責務が明確化されていない。

## 2. account center / settings hub 情報設計
- 共通概念: `accountCenter`, `settingsHub`, `accountSummary`, `profileSection`, `notificationSection`, `securitySection`, `supportSection`。
- 上段: account summary（membership / entitlement / subscription / billing / lifecycle）。
- 中段: 編集可能設定（profile / notification / preference）。
- 下段: security-sensitive（password reset / email change / hosted auth flow）と support 導線。
- `auth.users` は identity、`app-user` は business state の SoT として厳格に分離。

## 3. profile / identity / account summary
- profile 編集は mypage の既存 UI を継続（displayName / avatarUrl 拡張余地）。
- account summary は `membershipStatus`, `entitlementState`, `subscriptionState`, `billingState`, `lifecycleStage` を要約表示。
- non_member/member/grace/expired/suspended で next action を切り替え。

## 4. notification / preference settings
- NotificationPreferenceCenter に `notification_settings_view` と `notification_settings_save` を追加。
- email チャンネル更新時に `crm_preference_save` を発火し CRM 側と共通参照可能にする。
- required 通知は opt-out 不可、optional 通知は opt-out 可の責務分離を維持。

## 5. security / auth-sensitive flow
- self-service:
  - password reset: Supabase `/auth/v1/recover`
  - email change: Supabase `/auth/v1/user`（access token 必須）
- support 経由:
  - account suspension/restricted の解除
  - high-risk identity recovery
- 将来拡張余地:
  - MFA / linked accounts / device sessions を hosted 側導線として拡張

## 6. main / store / fc 導線統一
- 入口は site ごとに維持しつつ、到達先の account center 概念と文言を統一。
- どのサイトからの遷移でも `sourceSite` を analytics 属性に保持。

## 7. mypage / support / internal admin
- mypage: user-facing summary + self-service action の起点。
- support/internal: `authUserId` 起点で app-user / preference / lifecycle を追跡。
- user-facing 表示名と internal status 名を混同しない。

## 8. RLS / access / update policy
- self-service で更新可能: profile / preference。
- self-service で更新不可: membershipStatus / entitlementState / billingState / internalRole。
- DB policy は `auth.uid() = auth_user_id` を基本に維持し、service role 更新を限定。

## 9. notification / CRM / analytics 接続
- NotificationPreferenceCenter の保存結果を CRM イベントへ接続。
- account center の view/save/start イベントを lifecycle/membership 属性付きで送信。

## 10. 計測イベント（今回）
- `account_center_view`
- `account_summary_view`
- `notification_settings_view`
- `notification_settings_save`
- `crm_preference_save`
- `password_reset_start`
- `email_change_start`

## 11. env / GitHub Secrets / runtime
### frontend runtime
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PASSWORD_RESET_REDIRECT_URL`
- `VITE_SUPABASE_EMAIL_CHANGE_REDIRECT_URL`

### backend secrets
- `SUPABASE_SERVICE_ROLE_KEY`（frontend 露出禁止）
- `SUPABASE_JWT_ISSUER`
- `SUPABASE_JWKS_URI`
- `SUPABASE_JWT_AUDIENCE`

## 12. ローカル / staging / production 確認
1. login/logout/callback が main/store/fc で継続動作。
2. mypage で account summary と notification settings が表示。
3. password reset / email change が Supabase Auth API で開始できる。
4. `notification_settings_save` / `crm_preference_save` が analytics に送信される。

## 13. よくあるトラブル
- reset/email change 失敗: redirect URL 未設定または Auth provider 設定不整合。
- account center URL 未生成: project ref / provider 設定不足。
- support でユーザー特定不可: `authUserId` / `supabaseUserId` / `logtoUserId` 互換検索を実施。

## 14. 仮定
1. Supabase Auth の project は main/store/fc で単一。
2. mypage の profile 保存は現状 local + app-user 同期基盤を段階移行中。
3. security-sensitive 最終権限判定は Supabase Auth 側フローを正とする。
