# fc.mizzz.jp 現状調査と実装優先計画（2026-04-08）

## 1. 現状構成の要約

### frontend / backend 構成
- frontend は React 18 + TypeScript + Vite の SPA で、`VITE_SITE_TYPE` により `main / store / fanclub` を切り替えるマルチサイト構成。
- fanclub サイトは `isFanclubSite` 分岐と `FanclubLayout` 配下ルーティングで独立運用される構成。
- backend は Strapi v5。`backend/src/api/*` に content-type が分割され、`middlewares.ts` で CORS/セキュリティを管理。

### 既存認証基盤
- Clerk を利用し、`useCurrentUser` で `role / plan / contractStatus / emailVerified` を正規化。
- `FanclubAuthGuard` で未ログイン・未メール認証・会員状態不備を段階的に判定し、`/login?redirect=...` へ安全に誘導。
- `membership.ts` は `public / members / premium` の可視性判定と `active / grace / cancel_scheduled` の有効会員判定を保持。

### 既存 content type（Strapi）
- 既存: `news-item`, `blog-post`, `event`, `faq`, `site-setting`, `fanclub-content`, `media-item`, `store-product`, `work`, `profile` など。
- fanclub 運用で重要な `slug`, `publishAt`, `accessStatus`, `limitedEndAt`, `archiveVisibleForFC` などは既存モデルで運用実績あり。

### 会員限定公開の仕組み
- UI レベルの表示制御は `FanclubAuthGuard` と `canAccessByRole` で実施済み。
- 一部コンテンツは一般公開と会員限定のラベル出し分けをページ上で実装済み。
- backend 側の最終防御（premium 強制制御）は今後の強化対象。

### 既存 API クライアント
- `strapiGet` が timeout、retry、AbortController、`response.ok` 判定、content-type 検証、HTML 応答検知、JSON パース失敗の専用エラー化まで実装済み。
- `useAsyncState` で開発時は詳細ログ、本番は安全な汎用エラー文言に切り替える設計。
- `useStrapiCollection/useStrapiSingle` が `refetch` を返し、Retry UI 実装を載せやすい。

### News / Blog / Event / Gallery モデル
- News/Blog/Event は backend content-type と frontend 一覧/詳細ページが揃っている。
- Movies/Gallery/Ticket 情報は fanclub ページ内での暫定実装が中心で、本格 CMS モデル接続は未完了。

### fc.mizzz.jp サブドメイン受け先
- frontend は `VITE_FANCLUB_SITE_URL` と `fanclubLink` を基準に fanclub URL を解決。
- backend CORS は `https://fc.mizzz.jp` を許可済み。
- デプロイドキュメントに `main / store / fanclub` 3ターゲット配信フローを明記済み。

### 課金・会員管理基盤
- 認証は Clerk が土台として利用可能。
- 課金（Stripe 等）との server-side 同期、契約状態の authoritative source 化は未実装。

### 環境変数 / API URL / CORS / Cookie/Session 方針
- frontend: `VITE_SITE_TYPE`, `VITE_FANCLUB_SITE_URL`, `VITE_STRAPI_API_URL`, `VITE_STRAPI_API_TOKEN`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_STRAPI_TIMEOUT_MS`, `VITE_STRAPI_RETRY_COUNT` など。
- backend: `FRONTEND_URL` をカンマ区切りで管理し CORS origin に反映。CORS は `credentials: false`、Bearer/公開 API 前提。

### デプロイ方法
- frontend は GitHub Actions + FTP で静的配信（ロリポップ想定）。
- backend は Strapi Cloud 運用。

---

## 2. 使い回せる基盤
- マルチサイト切替 (`VITE_SITE_TYPE`) と fanclub 専用レイアウト/ルーティング。
- Clerk 連携済みユーザー正規化と認証ガード。
- Strapi API 防御クライアント（timeout/retry/HTML混入検知）。
- `ErrorState`/`EmptyState` 系コンポーネント。
- 既存 legal/contact/faq ページ群。

## 3. 新規実装が必要な箇所
1. Clerk と課金基盤（Stripe 等）のサーバー同期（契約状態の真実源）。
2. `Member Plan / Movie / Gallery / Ticket Info` の Strapi content-type 本実装。
3. fanclub 各一覧・詳細を暫定配列ではなく CMS API 接続へ移行。
4. premium 限定を backend でも強制する API 層ガード。
5. マイページの契約情報（次回更新日・解約予定日・猶予）を実データ化。

## 4. 会員機能実装上のリスク
- frontend 判定だけで premium 制御している期間の権限漏れリスク。
- Clerk metadata と実課金状態の不一致リスク。
- コンテンツモデル確定前に UI 先行すると運用負荷が増えるリスク。
- `fc.mizzz.jp` と `store.mizzz.jp` 連携時の会員状態伝播方式（SSO/JWT/署名リンク）未確定リスク。

## 5. 作業ブランチ名案
- `feature/fc-membership-base`（今回使用）
- `feature/fc-auth-and-protected-pages`
- `feature/fc-content-pages`
- `fix/fc-api-stability`

## 6. 実装優先順位
1. 認証・限定公開基盤（ログイン/ログアウト/メール認証/保護ページ/安全リダイレクト）。
2. API 安定化の全ページ適用（news/blog/movies/gallery/events/mypage/member-status）。
3. fanclub 必須ページ群の CMS 接続（最低限の運用成立）。
4. マイページと会員導線（入会・更新・解約・問い合わせ）整備。
5. 法務導線とモバイル体験最終調整。
6. store.mizzz.jp 連携拡張ポイント整備。

---

## 7. 会員導線フロー
1. `/` で価値訴求・会員特典・CTA を確認。
2. `/join` で会費/支払頻度/注意事項/同意情報を確認。
3. `/login` で認証（必要に応じて `/login/reset-password`, `/login/verify-email`）。
4. 保護ページ直アクセス時は `/login?redirect=...` に遷移。
5. ログイン後 `/mypage` で会員ステータスと契約導線を確認。
6. `/news`, `/blog`, `/movies`, `/gallery`, `/events` で visibility に応じて閲覧。

## 8. 追加 / 修正ファイル一覧（今回）
- `docs/fc-mizzz-implementation.md`

## 9. ルーティング一覧（fanclub 運用で必要）
- `/`
- `/about`
- `/join`
- `/login`
- `/login/reset-password`
- `/login/verify-email`
- `/mypage`
- `/news`, `/news/:slug`
- `/blog`, `/blog/:slug`
- `/movies`, `/movies/:slug`
- `/gallery`, `/gallery/:slug`
- `/events`, `/events/:slug`
- `/faq`
- `/contact`
- `/terms`
- `/privacy`
- `/legal`
- `/commerce-law`
- `/subscription-policy`

## 10. CMS モデル一覧
### 既存
- News (`news-item`)
- Blog Post (`blog-post`)
- Event (`event`)
- FAQ (`faq`)
- Site Settings (`site-setting`)
- Fanclub Content (`fanclub-content`)
- Media Item (`media-item`)

### 追加推奨（会員サイトとして成立させる最小）
- Member Plan
- Movie
- Gallery
- Ticket Info

### 共通必須概念
- `slug`
- `visibility` (`public / members / premium`)
- `publishAt`
- SEO（title/description/og/canonical）
- 関連コンテンツ
- 公開終了日時（必要に応じて）

## 11. API 一覧
### 既存 API
- `GET /api/news-items`
- `GET /api/blog-posts`
- `GET /api/events`
- `GET /api/faqs`
- `GET /api/site-setting`
- `GET /api/fanclub-contents`
- `GET /api/media-items`

### 追加推奨 API
- `GET /api/member-plans`
- `GET /api/movies`
- `GET /api/galleries`
- `GET /api/ticket-infos`
- `GET /api/member-status`

## 12. 認証 / 権限制御方針
- 認証: Clerk。
- ロール: `guest / free / member / premium / admin`。
- 契約状態: `active / grace / cancel_scheduled / canceled / expired`。
- 可視性: `public / members / premium`。
- 未ログイン時は `redirect` クエリを付与してログインへ誘導。
- 未メール認証・契約無効時は専用メッセージ + join/mypage 導線を表示。

## 13. エラー処理方針
- API クライアントで `response.ok` と content-type を必須検証。
- HTML 応答混入、JSON パース失敗は専用エラーとして扱う。
- timeout/retry/AbortController を標準化。
- UI は `ErrorState` と `EmptyState` を分離。
- Retry ボタンで同 fetcher を再実行。
- 開発は詳細ログ、本番は安全な文言のみ。

## 14. 法務対応一覧
- `/terms`
- `/privacy`
- `/commerce-law`
- `/subscription-policy`
- `/contact`

## 15. 環境変数一覧（fanclub 重点）
### frontend
- `VITE_SITE_TYPE=fanclub`
- `VITE_SITE_URL=https://fc.mizzz.jp`
- `VITE_MAIN_SITE_URL`
- `VITE_STORE_SITE_URL`
- `VITE_FANCLUB_SITE_URL`
- `VITE_STRAPI_API_URL`
- `VITE_STRAPI_API_TOKEN`
- `VITE_STRAPI_TIMEOUT_MS`
- `VITE_STRAPI_RETRY_COUNT`
- `VITE_CLERK_PUBLISHABLE_KEY`

### backend
- `FRONTEND_URL`（`https://mizzz.jp,https://store.mizzz.jp,https://fc.mizzz.jp`）
- `APP_KEYS`
- `HOST`
- `PORT`

## 16. デプロイ確認項目
- 未ログインで保護ページ直アクセス時に `/login?redirect=...` へ遷移する。
- ログイン後に保護ページへ復帰できる。
- `/mypage` が表示できる。
- News/Blog/Movies/Gallery/Events の導線が機能する。
- Error UI / Retry UI が動作する。
- モバイル表示が崩れない。
- `npm run build:frontend` / `npm run build:backend` が通る。
- 法務導線（terms/privacy/commerce-law/subscription-policy/contact）が揃っている。

## 17. 残課題
- 課金基盤と会員状態同期（Webhook + DB 永続化）。
- premium 限定コンテンツの backend 強制制御。
- 会員状態 API の標準化。
- store.mizzz.jp 連携（会員先行販売・限定特典配布）。

## 18. 作成したブランチ名
- `feature/fc-membership-base`

## 19. コミット一覧（今回）
- fc.mizzz.jp の現状調査と優先実装計画を更新

## 20. PR本文案
```md
## タイトル
fc.mizzz.jp の現状調査整理と会員基盤の優先実装計画を更新

## 概要
- fc.mizzz.jp を会員サイトとして成立させるため、既存基盤の棚卸しと優先順位を再整理
- 認証・限定公開・API 安定化・法務導線の実装順序を明文化

## 変更内容
- 現状構成（frontend/backend/auth/content-type/api/deploy）の調査結果を更新
- 使い回せる基盤 / 新規実装必要箇所 / リスクを整理
- ルーティング、CMS モデル、API、環境変数、デプロイ確認項目を更新

## 変更ファイル
- docs/fc-mizzz-implementation.md

## 確認手順
- `npm run lint --prefix frontend`
- `npm run build:frontend`
- `npm run build:backend`

## 未対応事項
- 課金同期
- premium の backend 強制制御
- Movie/Gallery/TicketInfo の本モデル接続

## リスク / 注意点
- 現時点では一部会員判定が frontend 主体のため、課金同期実装まで暫定運用
```

## 21. 仮定
- 課金システム本体（Stripe/Billing DB）は次フェーズ実装であり、現時点は Clerk 情報を会員判定の主要入力とする。
- fanclub の Movies/Gallery/Ticket は既存モデル再利用または新規モデル追加で段階的に置き換える。
- DNS/SSL と 3 サイト分離デプロイ設定は手順書どおり準備済みとする。
