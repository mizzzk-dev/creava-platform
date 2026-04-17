# Clerk から Logto への全面移行ランブック（main / store / fc）

## 概要

- 対象: `mizzz.jp` / `store.mizzz.jp` / `fc.mizzz.jp` / backend API / CI/CD / ドキュメント。
- 目的: Clerk 依存を撤去し、Logto Cloud + custom domain（`auth.mizzz.jp`）前提で運用可能にする。

## 1. 現状の Clerk 依存箇所一覧（調査結果）

- frontend
  - `main.tsx`: `ClerkProvider` による全体ラップ
  - `useCurrentUser`: `useUser()` から `AppUser` 正規化
  - `AuthButton`, `FanclubGuard`, `ContentAccessGuard`, `FanclubCTASection`, `FanclubSitePages`: `openSignIn` / `openSignUp` / `signOut` / `getToken`
  - `.env*`: `VITE_CLERK_*`
  - `package.json`: `@clerk/clerk-react`
- backend
  - `backend/src/lib/auth/clerk.ts`: Bearer token 解析（署名検証なし）
  - `payment controller`: `verifyClerkToken` 前提
  - content type: `payment-record.clerkUserId`, `subscription-record.clerkUserId`
- CI/CD
  - `.github/workflows/ci.yml`, `deploy.yml`: `VITE_CLERK_PUBLISHABLE_KEY`

## 2. Logto へ置き換える対象一覧

- frontend
  - `AppAuthProvider` + `useAuthClient` を新設して Logto SDK に統一
  - `/callback` を追加し OIDC callback を処理
  - `useCurrentUser` を claims ベースへ移行
  - ログイン/ログアウト/サインアップ導線を Logto API へ置換
- backend
  - `verifyLogtoToken` で JWKS 署名検証 + `iss`/`aud`/`exp`/scope 検証
  - 決済系 API の認証ヘルパーを Logto 前提へ置換
  - `authUserId` を保存（`clerkUserId` は互換保持）
- 運用
  - frontend env/CI secrets を `VITE_LOGTO_*` へ移行
  - backend env を `LOGTO_*` で明示

## 3. アーキテクチャ選定（app type）

- main: SPA
- store: SPA
- fc: SPA
- backend API: Logto API resource（`https://api.mizzz.jp`）
- M2M: 現時点では未導入（管理 API 自動操作を追加するときに追加）

選定理由: フロントは Vite + React のクライアント実行で、server secret を保持しないため。

## 4. URL / Redirect / CORS 設計

- endpoint: `https://auth.mizzz.jp`
- callback
  - local: `http://localhost:5173/callback`（サイト別ポート運用時は各ポートも追加）
  - prod: `https://mizzz.jp/callback`, `https://store.mizzz.jp/callback`, `https://fc.mizzz.jp/callback`
- post logout redirect
  - main: `https://mizzz.jp`
  - store: `https://store.mizzz.jp`
  - fc: `https://fc.mizzz.jp`
- CORS allowed origins
  - `https://mizzz.jp`
  - `https://store.mizzz.jp`
  - `https://fc.mizzz.jp`
  - local origins

## 5. API resource / scope / role 設計

- Resource: `https://api.mizzz.jp`
- 推奨 scope
  - `fanclub:checkout`
  - `fanclub:portal`
- backend env
  - `LOGTO_ISSUER`
  - `LOGTO_JWKS_URI`
  - `LOGTO_API_RESOURCE`
  - `LOGTO_REQUIRED_SCOPES`（カンマ区切り）

## 6. ユーザー情報・権限の扱い方針

- `sub` -> `AppUser.id`
- `email` / `email_verified` をユーザー表示へ使用
- `roles`（配列）優先、次に `role`（単体）で権限解決
- `memberPlan` / `contractStatus` はカスタムクレーム前提
- DB は `authUserId` を追加し、移行期間は `clerkUserId` も保持

## 7. GitHub Secrets / Variables 変更

- 追加（frontend build）
  - `VITE_LOGTO_ENDPOINT`
  - `VITE_LOGTO_APP_ID`
  - `VITE_LOGTO_API_RESOURCE`
- 削除候補
  - `VITE_CLERK_PUBLISHABLE_KEY`
  - その他 Clerk 専用 secrets

## 8. DNS / social connector 更新

- DNS
  - `auth.mizzz.jp CNAME domains.logto.app`
  - Cloudflare Proxy は OFF
- Social
  - connector 作成後に Sign-in Experience で表示有効化
  - custom domain 切替後は provider redirect URI も更新
  - GitHub は複数 redirect を扱うなら GitHub App を推奨

## 9. staging / production 切替手順

1. Logto tenant と 3 SPA app を作成
2. redirect/logout/CORS を登録
3. API resource / scopes を登録
4. GitHub Environment（staging/production）に `VITE_LOGTO_*` を登録
5. backend runtime env に `LOGTO_*` を登録
6. staging で login/callback/logout/API 401/403 を確認
7. production へ切替
8. Clerk 由来 env を削除

## 10. トラブルシューティング

- `invalid_redirect_uri`
  - Logto Console の Redirect URI と完全一致しているか確認
- 401（署名検証エラー）
  - `LOGTO_ISSUER` / `LOGTO_JWKS_URI` / `LOGTO_API_RESOURCE` の整合を確認
- 403（scope 不足）
  - `LOGTO_REQUIRED_SCOPES` と token scope を確認

## 11. Clerk 撤去後チェック

- `@clerk/clerk-react` が `frontend/package.json` に存在しない
- frontend コードに `@clerk/*` import がない
- CI secrets が `VITE_LOGTO_*` に置換済み
- backend 認証が `verifyLogtoToken` 経由になっている

