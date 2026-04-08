# fc.mizzz.jp 現状調査と実装優先計画（2026-04-08）

本ドキュメントは、**実装着手前の調査結果**と、会員サイト成立に向けた優先順位を整理したものです。

## 1. 現状調査結果

### frontend / backend の構成
- frontend は React 18 + TypeScript + Vite 構成で、`VITE_SITE_TYPE` により `main / store / fanclub` を切替する単一コードベースです。
- ルーティングは `isFanclubSite` 分岐で fanclub 向けを独立し、`FanclubLayout` 配下で運用されています。
- backend は Strapi v5 で、`backend/src/api/*` 配下に content type ごとの API が定義されています。

### 既存認証基盤
- Clerk 連携が実装済みで、`toAppUser` が `role / memberPlan / contractStatus / emailVerified` を正規化しています。
- `FanclubAuthGuard` で以下の順にアクセス制御を実施済みです。
  1. 未ログインなら `/login?redirect=...` へ遷移
  2. メール未認証なら認証案内表示
  3. 契約状態・権限不足なら join/mypage 導線を提示

### Strapi の既存 content type
- 既存モデル: `news-item`, `blog-post`, `event`, `fanclub-content`, `faq`, `site-setting`, `media-item`, `store-product`, `work`, `profile`, `award`。
- 主要コンテンツ（news/blog/event/fanclub/store/work）は `slug`, `publishAt`, `accessStatus`, `limitedEndAt`, `archiveVisibleForFC` を持ち、公開/限定公開の運用基盤があります。

### 会員限定公開の仕組み
- frontend では `canAccessByRole` と `isMembershipActive` で `public / members / premium` を判定済み。
- fanclub ルートで `FanclubAuthGuard` を利用して保護ページを制御済み。
- ただし backend 側で premium 強制制御をさらに強化する余地があります。

### 既存 API クライアント
- `strapiGet` で `response.ok` 判定、content-type 検証、HTML 応答検知、JSON パース失敗、timeout、retry、AbortController まで実装済み。
- in-flight 重複抑止、短期キャッシュ、stale-while-revalidate も実装済み。
- 呼び出し層 (`fetchCollection` / `fetchBySlug`) は認証要否を自動判定します。

### 既存 News / Blog / Event / Gallery モデル
- News/Blog/Event は Strapi モデル + 一覧/詳細ルートが成立しています。
- Movies/Gallery/Ticket は fanclub ページの暫定データ実装があり、CMS 直結は未完了です。

### サブドメイン `fc.mizzz.jp` の受け先
- `fanclubLink` と `VITE_FANCLUB_SITE_URL` で fanclub URL を解決します。
- `docs/deploy-production.md` に `main/store/fanclub` 分離デプロイ手順が定義済みです。
- backend CORS は `https://fc.mizzz.jp` を許可済みです。

### 課金・会員管理で使える既存基盤
- Clerk metadata を会員状態判定に利用できる土台があります。
- 一方で Stripe 等の課金システムとの authoritative な同期API/DBは未整備です。

### 環境変数 / API URL / CORS / Cookie・Session 方針
- frontend: `VITE_STRAPI_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SITE_TYPE`, `VITE_FANCLUB_SITE_URL` など。
- backend: `FRONTEND_URL` をカンマ区切りで CORS origin へ反映。
- CORS は `credentials: false` 設定で、現行は Bearer/public API 方針です。

### デプロイ方法
- frontend: GitHub Actions + FTP 配信（ロリポップ運用想定）。
- backend: Strapi Cloud。

### メインサイトと共通化できる基盤
- ヘッダー/フッターの設計思想（導線分離）、ThemeProvider、i18next(ja/en/ko)、SEO基盤は再利用可能です。

---

## 2. 使い回せる基盤
- マルチサイト切替 (`VITE_SITE_TYPE`)。
- fanclub 専用ルーティングとレイアウト。
- Clerk 認証 + `AppUser` 正規化。
- `FanclubAuthGuard` による未ログイン/未認証/契約不備の制御。
- Strapi API 防御クライアント（timeout/retry/HTML混入検知/AbortController）。
- i18n（ja/en/ko）と ThemeProvider（light/dark/system）。

## 3. 新規実装が必要な箇所
1. **課金同期**: Stripe 等と会員状態のサーバー同期（webhook + 永続化）。
2. **会員ステータスAPI**: `member-status` 相当の真実源を backend 側で提供。
3. **CMS モデル追加/拡張**: `Member Plan / Movie / Gallery / Ticket Info` を本運用モデル化。
4. **限定公開の backend 強制**: public API から premium 情報が漏れないよう API 層で制御。
5. **Fanclubホーム実データ化**: 「今週の更新」「注目導線」などを CMS 連携。
6. **お問い合わせ導線統一**: fc 内フォームを作らず `https://mizzz.jp` へ集約する文言・導線の統一。

## 4. 会員機能実装上のリスク
- frontend 先行制御の期間における API 直接アクセスリスク。
- Clerk metadata と課金実態（解約/猶予/失効）の不整合リスク。
- Movies/Gallery/Ticket のモデル未確定による再実装コスト。
- `fc.mizzz.jp` と `store.mizzz.jp` 間の会員状態連携方式未確定リスク。

## 5. 作業ブランチ名案
- `feature/fc-membership-base`（今回作業ブランチ）
- `feature/fc-auth-and-protected-pages`
- `feature/fc-content-pages`
- `fix/fc-api-stability`

## 6. 実装優先順位
1. 認証・限定公開制御（ログイン/ログアウト/メール認証/保護ページ/安全リダイレクト）
2. API 安定化の全 fanclub コンテンツ適用（news/blog/movies/gallery/events/mypage/member-status）
3. fanclub 必須ページの運用成立（法務・問い合わせ導線含む）
4. マイページの契約情報実データ化（更新/解約/失効/猶予）
5. ヘッダー/フッター・モバイル導線最適化
6. 多言語SEO/hreflang整備
7. store.mizzz.jp 連携拡張

## 7. 会員導線フロー
1. `/` で特典・最新更新・入会CTAを提示
2. `/join` で会費/支払い頻度/同意事項を提示
3. `/login` で認証（必要に応じて reset/verify）
4. 保護ページ直アクセスは `/login?redirect=...` へ遷移
5. 認証後に redirect 先または `/mypage` へ復帰
6. `/mypage` で会員状態/更新日/解約導線を確認
7. 各コンテンツで `visibility` に応じて閲覧可否を制御

## 8. 追加 / 修正ファイル一覧
- `docs/fc-mizzz-implementation.md`（本調査更新）

## 9. ルーティング一覧
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
- `/contact`（mainサイトへ統一誘導）
- `/legal`
- `/terms`
- `/privacy`
- `/commerce-law`
- `/subscription-policy`

## 10. CMS モデル一覧
### 既存
- News (`news-item`)
- Blog Post (`blog-post`)
- Event (`event`)
- Fanclub Content (`fanclub-content`)
- FAQ (`faq`)
- Site Settings (`site-setting`)
- Media Item (`media-item`)

### 追加優先
- Member Plan
- Movie
- Gallery
- Ticket Info

### 必須属性方針
- `slug`
- `visibility` (`public / members / premium`)
- `publishAt`
- SEO（title/description/og/canonical）
- 関連コンテンツ
- 公開終了日時（必要時）
- locale（ja/en/ko）

## 11. API 一覧
### 既存
- `GET /api/news-items`
- `GET /api/blog-posts`
- `GET /api/events`
- `GET /api/fanclub-contents`
- `GET /api/faqs`
- `GET /api/site-setting`
- `GET /api/media-items`

### 追加優先
- `GET /api/member-plans`
- `GET /api/movies`
- `GET /api/galleries`
- `GET /api/ticket-infos`
- `GET /api/member-status`

## 12. 認証 / 権限制御方針
- 認証は Clerk を継続利用。
- ロール: `guest / free / member / premium / admin`。
- 契約状態: `active / grace / cancel_scheduled / canceled / expired`。
- 可視性: `public / members / premium`。
- 未ログイン時は `redirect` 付きでログイン導線へ。
- backend API でも visibility と契約状態を強制する二重防御に移行。

## 13. エラー処理方針
- 全APIで `response.ok` / content-type 検証。
- HTML 応答混入・JSON パース失敗を専用エラー化。
- timeout/retry/AbortController を標準適用。
- ErrorState と EmptyState を分離。
- Retry ボタンを標準提供。
- 開発環境は詳細ログ、本番は安全な文言。

## 14. 法務対応一覧
- `/terms`
- `/privacy`
- `/commerce-law`
- `/subscription-policy`
- お問い合わせは `https://mizzz.jp` 側で一元受付（fc内独自フォームなし）

## 15. 多言語対応方針
- i18next の `ja/en/ko` を継続利用。
- 言語切替UIはヘッダー/フッターで常時到達可能にする。
- 未翻訳時は `ja` フォールバック。
- SEO は言語別 title/description と hreflang を段階導入。

## 16. テーマ切替方針
- ThemeProvider の `light/dark/system` を継続。
- ヘッダーに切替UIを配置し、`localStorage` 永続化。
- システムテーマ追従（`prefers-color-scheme`）を維持。

## 17. ヘッダー / フッター設計方針
- ブランド整合を優先しつつ fanclub 導線を浅い階層で提供。
- Header: News/Blog/Movies/Gallery/Events/Join/Login/Mypage + 言語・テーマ導線。
- Footer: About/FAQ/法務/お問い合わせ(main誘導)/SNS/サイト回遊導線。
- モバイルではドロワー導線と CTA 到達性を優先。

## 18. デプロイ確認項目
- 未ログイン時に保護ページを遮断できる。
- ログイン後に保護ページへ復帰できる。
- Mypage で会員状態が表示される。
- News/Blog/Movies/Gallery/Events が表示される。
- 問い合わせ導線が `https://mizzz.jp` へ遷移する。
- ヘッダー/フッター整合、テーマ切替、3言語切替が成立。
- Error UI / Retry UI が動作する。
- `npm run build:frontend` / `npm run build:backend` が通る。

## 19. 残課題
- 課金同期と契約状態の真実源API整備。
- premium コンテンツの backend 強制制御。
- Movies/Gallery/Ticket モデルの本番運用設計。
- store.mizzz.jp 連携時の会員先行/限定販売導線。

## 20. 作成したブランチ名
- `feature/fc-membership-base`

## 21. コミット一覧（予定）
- fc.mizzz.jp の現状調査と優先実装計画を更新

## 22. PR本文案
```md
## タイトル
fc.mizzz.jp の現状調査整理と会員基盤の優先実装計画を更新

## 概要
- fanclub 立ち上げに向け、既存基盤の棚卸しと優先順位を整理
- 認証 / 限定公開 / API安定化 / 法務導線を先行させる実装計画に更新

## 対応内容
- frontend/backend/auth/content-type/api/deploy の現状調査を更新
- 使い回せる基盤、新規実装必要箇所、リスクを整理
- ルーティング/CMSモデル/API/認証方針/エラー方針/法務/多言語/テーマ方針を整理

## 変更ファイル
- docs/fc-mizzz-implementation.md

## 確認手順
- npm run lint --prefix frontend
- npm run build:frontend
- npm run build:backend

## 未対応事項
- Stripe 等との課金同期
- premium の backend 強制制御
- Movies/Gallery/Ticket の CMS 本接続

## リスク / 注意点
- 現段階は Clerk metadata を主入力にしているため、課金同期実装まで暫定運用
```

## 23. 仮定
- 課金システム（Stripe/Billing DB）は次フェーズで導入する。
- Movies/Gallery/Ticket は既存 `fanclub-content` / `media-item` の再利用を含め段階移行する。
- DNS/SSL と 3 サイト分離デプロイは `docs/deploy-production.md` 手順どおり準備済みとする。
