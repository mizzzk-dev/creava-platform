# fc.mizzz.jp 実装計画 / 現状調査（Phase 3）

## 1. 現状調査結果

### frontend / backend 構成
- frontend は React + Vite + TypeScript、backend は Strapi v5 構成。
- `VITE_SITE_TYPE` で `main / store / fanclub` を切り替えるマルチサイト構成。
- fanclub サイト専用の `FanclubLayout` と fanclub ルート群が既に存在。

### 既存認証基盤
- 認証は Clerk を利用。
- `VITE_CLERK_PUBLISHABLE_KEY` 未設定時はゲストフォールバック。
- `useCurrentUser` でアプリ内ユーザーへ正規化。

### 既存 content type（Strapi）
- 既存: `news-item`, `blog-post`, `event`, `fanclub-content`, `faq`, `site-setting`, `store-product`, `work` など。
- すでに `accessStatus / limitedEndAt / archiveVisibleForFC / publishAt / slug` を持つモデルが複数存在。

### 会員限定公開の仕組み
- frontend 側で `accessStatus` をもとに表示可否制御あり。
- API クライアントは timeout/retry/レスポンス検証を実装済み。

### 既存 API クライアント
- `strapiGet` が `content-type` 検証、`response.ok` 判定、HTML 応答検知、JSON パース失敗の専用エラー、AbortController、retry を実装。
- `useAsyncState` が開発時詳細ログ / 本番向け安全メッセージを分離。

### News / Blog / Event / Gallery など
- `News / Blog / Event` は既存モデル + ページあり。
- `Movie / Gallery / Ticket Info / Member Plan` は本格運用モデルを今後追加する想定。

### サブドメイン `fc.mizzz.jp` の受け先
- frontend 側で `VITE_FANCLUB_SITE_URL` を使用。
- ドキュメントに `fc.mizzz.jp` を fanclub 配信先に向ける手順あり。
- backend CORS は `https://fc.mizzz.jp` を許可済み。

### 課金・会員管理基盤
- 認証は Clerk あり。
- 課金同期は未実装で、現状は会員状態を metadata/表示ロジックで保持する段階。

### 環境変数 / API URL / CORS / Cookie-Session
- frontend: `VITE_STRAPI_API_URL`, `VITE_STRAPI_API_TOKEN`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_FANCLUB_SITE_URL` 等。
- backend: `FRONTEND_URL`（CORS origin 追加）、DB は sqlite/postgres 切替。
- CORS は `credentials: false`。Cookie セッションより Authorization ベースを主軸。

### デプロイ方法
- frontend: 静的ビルドを FTP/GitHub Actions。
- backend: Strapi Cloud（または VPS）デプロイ手順あり。

### 使い回せる基盤
- fanclub ルーティング切替・レイアウト
- Clerk 連携（ログイン状態取得）
- Strapi の公開/限定向けフィールド群
- API 防御クライアント + ErrorState/Retry UI

### 新規実装が必要な箇所（次フェーズ）
- Clerk と課金プロバイダ（Stripe 等）のサーバー同期
- Movie / Gallery / Ticket Info の Strapi モデル本実装
- マイページ契約情報の API 実データ接続
- premium 専用配信の backend 強制制御

### 会員機能実装上のリスク
- Clerk metadata と実課金状態の不一致リスク
- premium 判定を frontend のみで行う期間の権限ギャップ
- Movie/Gallery/Ticket の CMS 運用モデル未確定
- サブドメイン間 SSO / Store 連携仕様未確定

---

## 2. 実装優先順位
1. 認証・保護ページ制御
2. 限定公開ロジックの拡張可能化（members/premium）
3. fanclub 必須ルート補完（法務/認証補助）
4. マイページ最低限UI（会員状態表示）
5. ドキュメント化（運用・残課題）

---

## 3. 会員導線フロー
1. `/` で特典と価値を確認
2. `/join` で会費/注意事項/同意情報を確認
3. `/login` からログイン
4. 未認証メールユーザーは `/login/verify-email` へ
5. 認証後 `/mypage` へ遷移し会員状態確認
6. `news/blog/movies/gallery/events/tickets` を visibility に応じて閲覧
7. `/member-store` から将来 `store.mizzz.jp` 連携導線へ

---

## 4. 追加 / 修正ファイル一覧（今回差分）
- 修正: `frontend/src/lib/routes.tsx`
- 修正: `frontend/src/pages/fc/FanclubSitePages.tsx`
- 修正: `docs/fc-mizzz-implementation.md`

---

## 5. ルーティング一覧（fanclub）
- `/`
- `/about`
- `/join`
- `/login`
- `/login/reset-password`
- `/login/verify-email`
- `/mypage`（保護）
- `/news` `/news/:slug`
- `/blog` `/blog/:slug`
- `/movies` `/movies/:slug`
- `/gallery` `/gallery/:slug`
- `/events` `/events/:slug`
- `/tickets` `/tickets/:slug`
- `/member-store`
- `/faq`
- `/contact`
- `/guide`
- `/legal`
- `/terms`
- `/privacy`
- `/commerce-law`
- `/subscription-policy`

---

## 6. CMS モデル一覧（最低運用）
- 既存で利用可能: News, Blog Post, Event, FAQ, Site Settings
- 追加推奨: Member Plan, Movie, Gallery, Ticket Info
- visibility は `public / members / premium` の3段階を推奨

---

## 7. API 一覧
### 既存
- `GET /api/news-items`
- `GET /api/blog-posts`
- `GET /api/events`
- `GET /api/faqs`
- `GET /api/site-setting`

### 追加推奨
- `GET /api/member-plans`
- `GET /api/movies`
- `GET /api/galleries`
- `GET /api/ticket-infos`
- `GET /api/member-status`

---

## 8. 認証 / 権限制御方針
- 認証: Clerk
- ロール: `guest / free / member / premium / admin`
- 会員契約状態: `active / grace / cancel_scheduled / canceled / expired`
- 表示可視性: `public / members / premium`
- 保護ページ（`/mypage`, `/member`）は未ログイン時に `/login?redirect=...` へ安全リダイレクト
- メール未認証時は `/login/verify-email` に誘導

---

## 9. エラー処理方針
- API層で response/content-type/JSON パースを防御
- timeout + retry + AbortController を標準化
- UIは ErrorState と EmptyState を分離
- Retry ボタンを表示
- 開発: 詳細エラー / 本番: 汎用安全メッセージ

---

## 10. 法務対応一覧
- `/terms`（利用規約）
- `/privacy`（プライバシーポリシー）
- `/commerce-law`（特商法）
- `/subscription-policy`（継続課金/解約）
- `/contact`（問い合わせ）

---

## 11. 環境変数一覧（fanclub 運用で重要）
- `VITE_SITE_TYPE=fanclub`
- `VITE_SITE_URL=https://fc.mizzz.jp`
- `VITE_FANCLUB_SITE_URL=https://fc.mizzz.jp`
- `VITE_MAIN_SITE_URL`
- `VITE_STORE_SITE_URL`
- `VITE_STRAPI_API_URL`
- `VITE_STRAPI_API_TOKEN`
- `VITE_STRAPI_TIMEOUT_MS`
- `VITE_STRAPI_RETRY_COUNT`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `FRONTEND_URL`（backend 側。`fc.mizzz.jp` を含める）

---

## 12. デプロイ確認項目
- 未ログイン時に `/mypage` が `/login?redirect=...` へ遷移
- 認証後に保護ページへ復帰可能
- `news/blog/movies/gallery/events` 一覧/詳細遷移確認
- ErrorState + Retry 挙動確認
- 法務ページ導線確認（footer / legal index）
- モバイル幅でヘッダーとカード崩れなし
- frontend build / backend build 通過

---

## 13. 残課題
- Clerk metadata と課金プロバイダ（Stripe等）のサーバー同期
- premium 専用コンテンツの backend 強制制御
- Movie / Gallery / TicketInfo の Strapi 本モデル追加
- Store（`store.mizzz.jp`）との会員先行販売連携
- 解約/失効の自動反映ジョブ整備

---

## 14. 作成したブランチ名
- `feature/fc-auth-and-protected-pages`

---

## 15. コミット一覧（このブランチで作成）
- ファンクラブ保護ルートとログイン導線を強化

---

## 16. PR本文案
```md
## タイトル
ファンクラブ認証基盤と限定公開制御を追加

## 概要
- fc.mizzz.jp の会員サイト運用で最優先の認証・保護ページ制御を強化
- 未ログイン / 未認証 / 会員状態不備の各ケースで安全な導線を統一

## 変更内容
- FC ルートの一部（`/schedule` `/tickets` `/tickets/:slug` `/member-store`）を認証ガード対象に変更
- ログインページに Clerk サインイン / サインアップ導線を追加し、`redirect` クエリを安全に処理
- 現状調査ドキュメントを Phase 3 として更新し、未対応事項を整理

## 確認手順
- `npm run lint --prefix frontend`
- `npm run build:frontend`
- `npm run build:backend`
- `npm run test:frontend`

## 影響範囲
- frontend: fanclub ルーティング、ログイン導線
- docs: fc 実装計画

## 破壊的変更
- なし

## 未対応事項
- 課金基盤と Clerk metadata のサーバー同期
- Movie / Gallery / TicketInfo の Strapi 本モデル実装
```

---

## 仮定
- 本フェーズでは課金バックエンド未接続のため、会員状態は Clerk metadata 主体で扱う。
- `Movie / Gallery / Ticket` はまずルート・導線を先行し、CMS モデル本実装は次フェーズ。
- `fc.mizzz.jp` の DNS/SSL は運用手順書どおりに準備済みである前提。
