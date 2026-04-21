# Supabase Auth 単一認証基盤移行計画（main/store/fc 共通）

更新日: 2026-04-21

## 0. 方針
- main / store / fc の認証を **単一 Supabase Auth プロジェクト** に統一する。
- 認証状態（Supabase）と会員状態・権利状態・課金状態（app DB）を責務分離する。
- 段階移行のため backend は `AUTH_PROVIDER=dual` で Logto + Supabase の受け入れを維持し、既存ユーザーのログイン不能事故を避ける。

## 1. 現在の認証分断ポイント（調査結果）
1. frontend / backend とも Logto 固定の命名・環境変数が多数残っている。
2. app-user は `logtoUserId` を主キー運用しており、Supabase User ID の保管先が未整備。
3. callback / logout は Logto endpoint 前提で、Supabase redirect/callback の整理が不足。
4. support / admin lookup の検索キーが `logtoUserId` 中心で、将来の統一 ID 表示が不足。

## 2. Supabase Auth 移行時の危険箇所
- redirect URL exact match ミスによる callback 失敗。
- 同一メールで旧 Logto ユーザーと新 Supabase ユーザーが分離し duplicate account になるリスク。
- membership 判定を auth claim の role に寄せすぎると business state と乖離するリスク。
- backend API のトークン検証が provider 混在期間に失敗するリスク。

## 3. app 側 user status に寄せる情報
- `membershipStatus`, `accountStatus`, `entitlementState`, `subscriptionState`, `billingState`
- `lifecycleStage`, `notificationPreference`, `crmPreference`
- `firstLoginAt`, `lastLoginAt`, `linkedProviders`, `statusUpdatedAt`

## 4. Supabase Auth に残す責務
- 本人認証（password / OTP / magic link / social / SSO / MFA）
- JWT セッション管理
- identity linking（同一 email OAuth 自動リンク）
- アカウント原本（`auth.users`）

## 5. role/permission と membershipStatus 分離
- `membershipStatus` は app-user / entitlement / subscription 由来で決定。
- `role` は internal admin / support / moderation の内部権限用途を維持。
- member-only 判定は backend 側で app DB status を参照して最終判定。

## 6. fallback / rollback
- `AUTH_PROVIDER=dual` で backend は Supabase JWT 検証失敗時に Logto 検証へフォールバック。
- frontend は `VITE_AUTH_PROVIDER` で段階切替（logto → supabase）。
- 緊急時は `VITE_AUTH_PROVIDER=logto`, `AUTH_PROVIDER=logto` で復帰可能。

## 7. 作業ブランチ名案
- `feature/supabase-auth-unification-and-user-status`

## 8. 実装順
1. 現状確認（本ドキュメント）
2. 認証抽象化（frontend/backend provider 切替）
3. app-user schema 拡張（supabaseUserId 追加）
4. callback / redirect / env 整備
5. docs / runbook / secrets 手順更新

## 9. 今回の実装差分
- frontend: `VITE_AUTH_PROVIDER=supabase` を追加し `AuthProvider` を provider 切替対応。
- frontend: Supabase OAuth callback 処理・session 復元を追加（PKCE + REST ベース）。
- backend: `verifyAccessToken` を追加し `logto/supabase/dual` を切替可能化。
- backend: Supabase JWT 検証（issuer/audience/JWKS/署名）を追加。
- backend: app-user schema に `supabaseUserId` を追加し authIdentity default を `supabase` へ変更。
- env example: Supabase / unified auth 変数を追加。

## 10. redirect/callback/provider 設計
- 共通 callback path: `/callback`
- local: `http://localhost:5173/callback`
- staging: `https://stg.mizzz.jp/callback`, `https://store-stg.mizzz.jp/callback`, `https://fc-stg.mizzz.jp/callback`
- production: `https://mizzz.jp/callback`, `https://store.mizzz.jp/callback`, `https://fc.mizzz.jp/callback`
- post logout: 各 origin の `/` を基本とし、ログアウト後の returnTo はクエリで保持しない。

## 11. GitHub Secrets / runtime env
- Frontend runtime:
  - `VITE_AUTH_PROVIDER`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_SUPABASE_OAUTH_DEFAULT_PROVIDER`
  - `VITE_SUPABASE_PROJECT_REF`
- Backend runtime:
  - `AUTH_PROVIDER`
  - `SUPABASE_JWT_ISSUER`
  - `SUPABASE_JWKS_URI`
  - `SUPABASE_JWT_AUDIENCE`

## 12. 動作確認項目
- main/store/fc の login/logout/callback が provider 切替後も動作する。
- non_member/member/grace/expired/suspended の出し分けが app-user status で継続する。
- support/admin で `supabaseUserId` と app-user の紐付けが追える。

## 13. 残課題
- support lookup API のパラメータ名を `authUserId` へ段階リネーム。
- social provider 複数有効時の linking 監査ログを追加。
- `@supabase/ssr` を使う SSR 実装へ移る場合の cookie 戦略を別 PR で整備。

## 14. 仮定
1. 当面は SPA 構成であり、SSR は未採用（将来導入余地あり）。
2. Supabase project は 1 つで main/store/fc 共用する。
3. membership / entitlement / billing の SoT は現行 Strapi app-user + subscription-record + entitlement-record とする。
4. 運用期間中に Logto と Supabase を並行運用し、既存ユーザー再ログインを段階誘導する。
