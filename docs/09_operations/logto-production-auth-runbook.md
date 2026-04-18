# Logto 本番運用ランブック（main / store / fc 横断）

- 更新日: 2026-04-18
- 対象: `mizzz.jp` / `store.mizzz.jp` / `fc.mizzz.jp` / frontend / backend / CI / 運用
- 目的: Logto を「ログイン実装」から「認証・認可・運用基盤」へ整理する

## 1. 現在の Logto 基盤課題（整理前）

1. フロントの App ID が単一 env 依存で、main/store/fc の分離運用が曖昧。
2. callback 後の復帰先が固定され、ログイン前導線の文脈を戻せない。
3. access token の refresh を実装しておらず、長時間利用時の UX 低下余地がある。
4. backend scope 検証が全体一律で、操作単位（checkout/portal）の明示が弱い。
5. Logto custom domain と default endpoint の責務が docs 上で混在しやすい。
6. GitHub Secrets にサイト別 App ID / issuer / management endpoint の整理粒度が不足。

## 2. Logto アーキテクチャ整理

## 2.1 Application type

- main: SPA
- store: SPA
- fc: SPA
- backend API: API Resource (`https://api.mizzz.jp`)
- automation / Management API: M2M（必要時に有効化）

## 2.2 endpoint 使い分け

- **End-user 認証（Hosted Sign-in）**: custom domain `https://auth.mizzz.jp`
- **Management API / M2M token**: default tenant endpoint `https://{tenant}.logto.app`

> Logto Cloud では Management API に custom domain を使わない。

## 2.3 app 分割方針

- main/store/fc は **別 SPA app** を推奨（障害切り分け・redirect 管理・権限誤配布防止）。
- 一時的に単一 app を併用する場合は `VITE_LOGTO_APP_ID` を fallback として許容し、段階移行する。

## 3. Application / redirect / domain 整理

## 3.1 命名規則（例）

- `mizzz-main-spa-{env}`
- `mizzz-store-spa-{env}`
- `mizzz-fc-spa-{env}`
- `mizzz-management-m2m-{env}`

## 3.2 Redirect URI 一覧

- local
  - `http://localhost:5173/callback`
  - （必要に応じて store/fc 用ローカルポート）
- staging
  - `https://stg.mizzz.jp/callback`
  - `https://store-stg.mizzz.jp/callback`
  - `https://fc-stg.mizzz.jp/callback`
- production
  - `https://mizzz.jp/callback`
  - `https://store.mizzz.jp/callback`
  - `https://fc.mizzz.jp/callback`

## 3.3 Post logout redirect 一覧

- `https://mizzz.jp`
- `https://store.mizzz.jp`
- `https://fc.mizzz.jp`
- staging は各 stg ドメイン

## 3.4 CORS / Allowed origins

- `https://mizzz.jp`
- `https://store.mizzz.jp`
- `https://fc.mizzz.jp`
- staging + localhost

## 3.5 DNS

- `auth.mizzz.jp` を使う場合のみ CNAME 追加が必要。
- それ以外の今回の実装変更（env/コード/docs更新）は **DNS変更不要**。

## 4. RBAC / permissions / organization 設計

## 4.1 スコープ最小構成（現行）

- `fanclub:checkout`
- `fanclub:portal`

backend の payment controller で操作単位にスコープ検証を行う。

## 4.2 役割と責務

- frontend: claims を使って UI 表示制御（role/memberPlan/contractStatus）
- backend: scope / permission を必須検証（重要操作の最終防衛線）

## 4.3 organizations

- 現時点は B2C 単一ブランド運用のため **未採用**。
- 将来、法人別ポータル・複数運営主体が必要になった時に organization template を導入。

## 5. frontend auth 実装方針（本リポジトリ準拠）

1. `VITE_LOGTO_APP_ID_MAIN/STORE/FC` を追加し、`VITE_SITE_TYPE` で自動選択。
2. callback 後はログイン前の意図した復帰先へ遷移。
3. `getAccessToken()` は refresh_token grant で再取得を試行。
4. token endpoint の `content-type` を検証し、HTML 混入をエラー化。
5. auth 関連 storage key をサイト別 namespace 化。

## 6. backend token validation / middleware 方針

- `verifyLogtoToken` で `iss` / `aud` / `exp` / `RS256` 署名を検証。
- route ごとに必要スコープ（checkout/portal）を追加チェック。
- 401（認証失敗）と403（権限不足）を切り分ける。
- 認証ログに PII を過剰出力しない。

## 7. social sign-in / account linking / passkey / MFA

- 今回は hosted sign-in を前提に運用（UI を自前再実装しない）。
- social connector は Google/Apple/X/Facebook を必要最小で段階有効化。
- account linking は同一メールの誤統合リスクを考慮し、初期は慎重設定。
- passkey / MFA は「導入余地を確保」し、次PRで段階導入する。

## 8. Management API / automation

- M2M app を作成し、role assign / profile sync などの自動化余地を確保。
- Management API token 取得は backend/job 側でのみ実行。
- Secret は GitHub Secrets + runtime env のみ管理（frontend 禁止）。

## 9. env / GitHub Secrets / runtime / CI

## 9.1 frontend env

- `VITE_LOGTO_ENDPOINT`
- `VITE_LOGTO_APP_ID_MAIN`
- `VITE_LOGTO_APP_ID_STORE`
- `VITE_LOGTO_APP_ID_FC`
- `VITE_LOGTO_APP_ID`（互換fallback）
- `VITE_LOGTO_CALLBACK_PATH`
- `VITE_LOGTO_POST_LOGOUT_REDIRECT_URI`
- `VITE_LOGTO_API_RESOURCE`
- `VITE_LOGTO_ISSUER`
- `VITE_LOGTO_MANAGEMENT_API_ENDPOINT`

## 9.2 backend env

- `LOGTO_ISSUER`
- `LOGTO_JWKS_URI`
- `LOGTO_API_RESOURCE`
- `LOGTO_REQUIRED_SCOPES`
- `LOGTO_MANAGEMENT_API_ENDPOINT`
- `LOGTO_M2M_APP_ID`
- `LOGTO_M2M_APP_SECRET`

## 9.3 CI Secrets（推奨）

- `VITE_LOGTO_ENDPOINT`
- `VITE_LOGTO_APP_ID_MAIN`
- `VITE_LOGTO_APP_ID_STORE`
- `VITE_LOGTO_APP_ID_FC`
- `VITE_LOGTO_APP_ID`（段階移行用）
- `VITE_LOGTO_API_RESOURCE`
- `VITE_LOGTO_ISSUER`
- `VITE_LOGTO_MANAGEMENT_API_ENDPOINT`

## 10. local / staging / production 確認手順

1. main/store/fc それぞれで login → callback → 復帰先 を確認。
2. sign-out 後に各サイトトップへ戻ることを確認。
3. `/payments/fanclub/checkout-session` が scope 不足時 403 になることを確認。
4. `/payments/customer-portal/session` が scope 不足時 403 になることを確認。
5. issuer / audience 不一致 token が 401 になることを確認。

## 11. よくあるトラブル

- `invalid_redirect_uri`
  - Logto app の redirect URI と callback URL 完全一致を確認
- callback 後に意図しないページへ戻る
  - `redirect` query と sessionStorage の復帰先キーを確認
- 403（権限不足）
  - token の scope claim と API 必要 scope 定義を突合
- Management API が失敗
  - endpoint が custom domain ではなく default tenant endpoint か確認

## 12. Cloud / OSS 切替の備え

- `endpoint` / `issuer` / `jwks` / `management endpoint` を env で分離しているため、
  主要コード変更なしで切替しやすい。
- custom domain 依存は end-user 認証導線に限定しているため、運用影響を局所化できる。
