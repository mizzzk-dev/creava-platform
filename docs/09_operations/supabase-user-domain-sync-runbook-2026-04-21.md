# Supabase Auth 前提 user domain 同期 / RLS / mypage 連携ランブック（2026-04-21）

## 1. 方針（source of truth 分離）
- 認証 SoT: Supabase Auth（`auth.users`）
- 業務 SoT: app user domain（Strapi `app-user`）
- 会員状態は `membershipStatus` を正として扱い、role/permission は内部権限用途に限定する。

## 2. `auth.users` と app-user の責務分離
- `auth.users`: `sub`, email, provider, session を保持。
- `app-user`: `accountStatus`, `membershipStatus`, `entitlementState`, `subscriptionState`, `billingState`, `lifecycleStage` など運用状態を保持。
- `authUserId` を app-user の正規参照キーとして追加し、`supabaseUserId` / `logtoUserId` は移行互換のため残す。

## 3. 初回プロビジョニング
- フロントログイン後に `/api/user-sync/provision` を呼び出し。
- backend は Bearer JWT を検証し、`authUserId` で app-user を検索。
- 未作成時は app-user / notification-preference を作成、既存時は `lastLoginAt` と状態を冪等更新。
- 重複対策: `authUserId` を unique にし、再ログインでは update のみ実行。

## 4. 状態モデル
- accountStatus: active / pending / restricted / suspended / deleted_like
- membershipStatus: non_member / member / grace / expired / canceled / suspended
- entitlementState: inactive / active / limited / grace / blocked
- subscriptionState: none / trialing / active / past_due / canceled / expired
- billingState: clear / pending / failed / refunded / disputed
- lifecycleStage: guest / authenticated_non_member / active_member / grace_member / expired_member / suspended_user ほか

## 5. RLS 設計方針（Supabase）
以下を Supabase 側 SQL migration として適用する。
1. `public.user_profiles` は `auth.uid() = auth_user_id` のみ select/update 可。
2. `public.user_state_snapshots` は owner 読み取り可、書き込みは backend service role のみ。
3. `public.internal_user_views` は通常ロール deny、support/admin 専用 JWT claim で許可。
4. member-only テーブルは `membership_status in ('member','grace')` を policy 条件に入れる。

## 6. main / store / fc / mypage 連携
- 3サイト共通で同一 Auth（Supabase）を利用。
- 表示制御は claims role ではなく `user-sync/me` の lifecycle summary を参照。
- mypage は account summary（membership/subscription/billing/lifecycle）を共通表示。

## 7. support / internal admin 連携
- internal lookup は `authUserId` を主キーに検索（`logtoUserId` パラメータ互換あり）。
- summary / dangerous operation API の path param を `:authUserId` へ追加。
- support lookup も `authUserId` で照会可能。

## 8. Secrets / runtime env
- frontend（公開可）: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- backend（秘匿）: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_ISSUER`, `SUPABASE_JWKS_URI`, `SUPABASE_JWT_AUDIENCE`
- **禁止**: `SUPABASE_SERVICE_ROLE_KEY` を frontend へ露出しない。

## 9. staging/prod 確認手順
1. Supabase login → `/callback` → `/api/user-sync/provision` 成功。
2. 同一ユーザー再ログインで app-user が増殖しない（unique `authUserId`）。
3. `/api/user-sync/me` が membership/subscription/billing/lifecycle を返す。
4. internal admin で同一 `authUserId` をキーに summary と status 更新が可能。
5. RLS 検証: anon で member-only テーブルが直接取得できない。

## 10. よくあるトラブル
- **症状**: `user-sync/provision` 401
  - Bearer JWT が失効または issuer/audience mismatch。
- **症状**: internal admin でユーザー未検出
  - `authUserId` 未同期。`supabaseUserId` / `logtoUserId` 互換検索で調査。
- **症状**: membership 表示ずれ
  - `entitlement-record` / `subscription-record` の最新レコード更新時刻を確認。

## 11. 仮定
1. Supabase Auth は main/store/fc 共通 project を使用している。
2. app-user は Strapi を業務 SoT として継続利用する。
3. internal admin の認可は既存 internal permission middleware を継続利用する。
