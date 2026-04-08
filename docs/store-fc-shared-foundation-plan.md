# store.mizzz.jp / fc.mizzz.jp 共通基盤実装メモ（2026-04-08）

## 1. 現状調査結果
- frontend は `VITE_SITE_TYPE` で `main/store/fanclub` を切替える単一SPA。ルート分岐は `frontend/src/lib/routes.tsx`。
- backend は Strapi v5。主要 content-type は `store-product / fanclub-content / news-item / blog-post / event / faq / site-setting`。
- API クライアントは `frontend/src/lib/api/client.ts` で timeout / retry / AbortController / content-type 検証 / HTML混入エラー化を実装済み。
- i18n は `ja/en/ko` で初期化済み（`frontend/src/lib/i18n.ts`）。
- テーマ切替は `ThemeProvider`（light/dark/system + localStorage + system追従）を実装済み（`frontend/src/lib/theme.tsx`）。
- 認証は Clerk + `FanclubAuthGuard` が利用可能。
- サブドメイン導線は `frontend/src/lib/siteLinks.ts` で `main/store/fc` を絶対URL化。
- デプロイは frontend(FTP) / backend(Strapi Cloud) の構成（`docs/deploy-production.md`）。

## 2. そのまま使えるもの
- i18next 3言語基盤
- ThemeProvider + ThemeToggle
- Strapi API 防御クライアント
- FanclubAuthGuard
- PageHead/StructuredData などSEO基盤
- routeConstants/siteLinks によるルーティング統一

## 3. 新規実装が必要なもの
- store/fc 間で共通利用するヘッダー・フッターの実装統一
- 問い合わせ導線の `mizzz.jp/contact` 一本化（fc側も）
- サブドメイン共通の法務導線統一
- 追加ページの翻訳文言整備（ja/en/ko）

## 4. 先に直すべき不具合
- fanclub サイトの `/contact` が個別フォームに繋がっていたため、メインサイト問い合わせへ統一が必要。
- store/fc のレイアウト実装が分散し、共通導線（main/store/fc回遊・言語・テーマ）に差異があった。

## 5. 作業ブランチ名
- `feature/store-fc-shared-foundation`

## 6. 実装優先順位
1. 共通ヘッダー/フッター
2. 問い合わせ導線統一
3. API安定化の横展開（既存は実装済み、ページ適用確認）
4. i18n/テーマ切替UIのサブドメイン整合
5. store/fc 主要導線の調整

## 7. 共通基盤でやること（今回実装）
- `SubdomainHeader` 追加（ロゴ、グロナビ、言語、テーマ、モバイルドロワー）
- `SubdomainFooter` 追加（法務、FAQ、main/store/fc 回遊、問い合わせ導線、言語切替）
- StoreLayout / FanclubLayout を共通部品へ統一
- fanclub `/contact` をメインサイトリダイレクトへ変更

## 8. store でやること（次フェーズ）
- `/news` `/faq` `/guide` `/shipping-policy` `/returns` のCMS文言連携強化
- 商品管理（slug/price/画像）未入力警告の Strapi 管理画面改善
- 新着/注目/表示順運用 UI の整理

## 9. fc でやること（次フェーズ）
- `/movies` `/gallery` `/events` のCMS連携拡張
- `/mypage` の会員状態API真実源整備
- 限定公開制御の backend 側強化

## 10. 追加 / 修正ファイル一覧
- `frontend/src/components/layout/SubdomainHeader.tsx`（追加）
- `frontend/src/components/layout/SubdomainFooter.tsx`（追加）
- `frontend/src/components/layout/StoreLayout.tsx`（更新）
- `frontend/src/components/layout/FanclubLayout.tsx`（更新）
- `frontend/src/lib/routes.tsx`（更新）
- `docs/store-fc-shared-foundation-plan.md`（追加）

## 11. ルーティング一覧（今回影響）
- store: `/`, `/products`, `/products/:handle`, `/news`, `/news/:slug`, `/faq`, `/guide`, `/shipping-policy`, `/returns`, `/terms`, `/privacy`, `/legal`, `/contact`
- fc: `/`, `/about`, `/join`, `/login`, `/mypage`, `/news`, `/blog`, `/movies`, `/gallery`, `/events`, `/faq`, `/terms`, `/privacy`, `/legal`, `/commerce-law`, `/subscription-policy`, `/contact`

## 12. CMS モデル一覧
- `award`
- `blog-post`
- `event`
- `fanclub-content`
- `faq`
- `media-item`
- `news-item`
- `profile`
- `site-setting`
- `store-product`
- `work`

## 13. API 一覧（主要）
- `GET /api/store-products`
- `GET /api/news-items`
- `GET /api/blog-posts`
- `GET /api/events`
- `GET /api/fanclub-contents`
- `GET /api/faqs`
- `GET /api/site-setting`

## 14. 認証 / 権限制御方針
- fanclub 保護ページは `FanclubAuthGuard` で制御。
- 未ログイン時は login へ遷移、認証/会員状態で表示分岐。
- 今回は導線統一を優先し、課金同期・強制制御は次フェーズ。

## 15. エラー処理方針
- `strapiGet` の防御処理を全取得系で継続利用。
- ErrorState と EmptyState を分離。
- Retry は `ErrorState` の `onRetry` を利用。
- 本番は安全文言、開発は追加デバッグ情報を出す方針を継続。

## 16. 多言語対応方針
- i18n は `ja/en/ko` 継続。
- 共通ヘッダー・フッターの言語切替から操作可能。
- 未翻訳時は `ja` フォールバック。

## 17. テーマ切替方針
- `ThemeToggle` をサブドメイン共通ヘッダーへ配置。
- localStorage 記録値を優先し、未設定時は system。

## 18. ヘッダー / フッター設計方針
- Header: logo / nav / lang / theme / mobile drawer。
- Footer: 法務・FAQ・問い合わせ(main)・main/store/fc 回遊。
- 問い合わせは全導線で `https://mizzz.jp/contact` に統一。

## 19. SEO / 法務対応一覧
- store/fc は各既存ページの `PageHead` を継続利用。
- フッター法務導線を統一（terms/privacy/commerce-law/subscriptionなど）。
- canonical / og / sitemap は既存構成を維持し、次フェーズで言語別hreflangを強化。

## 20. 環境変数一覧（主要）
- frontend: `VITE_SITE_TYPE`, `VITE_SITE_URL`, `VITE_MAIN_SITE_URL`, `VITE_STORE_SITE_URL`, `VITE_FANCLUB_SITE_URL`, `VITE_STRAPI_API_URL`, `VITE_STRAPI_API_TOKEN`, `VITE_CLERK_PUBLISHABLE_KEY`
- backend: `FRONTEND_URL`, `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `DATABASE_URL`

## 21. デプロイ確認項目
- `VITE_SITE_TYPE=store|fanclub` で各ルート表示
- header/footer の main/store/fc 回遊
- `/contact` が `mizzz.jp/contact` に遷移
- テーマ・言語切替が維持される
- frontend/backend build 成功

## 22. 残課題
- store / fc 文言の ja/en/ko 完全翻訳
- fanclub 会員状態のサーバー真実源
- Strapi 管理画面の入力バリデーションUX改善
- hreflang / 言語別sitemap の運用強化

## 23. コミット一覧
- 共通ヘッダー・フッター基盤を追加
- fanclub の問い合わせ導線をメインサイトへ統一
- store/fc レイアウトを共通基盤へ移行
- 実装計画ドキュメントを追加

## 24. PR本文案
### 概要
store.mizzz.jp / fc.mizzz.jp の立ち上げ準備として、共通ヘッダー・フッター基盤を追加し、問い合わせ導線を mizzz.jp に統一しました。

### 対応内容
- SubdomainHeader / SubdomainFooter を追加
- StoreLayout / FanclubLayout を共通基盤へ置き換え
- fanclub `/contact` をメインサイト問い合わせに統一
- 調査結果・優先順位・残課題を docs に整理

### 変更ファイル
- frontend/src/components/layout/SubdomainHeader.tsx
- frontend/src/components/layout/SubdomainFooter.tsx
- frontend/src/components/layout/StoreLayout.tsx
- frontend/src/components/layout/FanclubLayout.tsx
- frontend/src/lib/routes.tsx
- docs/store-fc-shared-foundation-plan.md

### 確認手順
- `npm run test:frontend`
- `npm run lint --prefix frontend`
- `npm run build:frontend`
- `npm run build:backend`

### 未対応事項
- fanclub 課金同期
- store 管理画面の入力補助UI
- 多言語SEO強化

### リスク
- 文言は一部固定文字列を含むため、次フェーズで翻訳キー化が必要。

## 仮定
- store/fc の問い合わせは今後も個別フォームを設けず、mizzz.jp の問い合わせに一本化する。
- store/fc デザインはメインサイト準拠を優先し、追加の演出系UIは次フェーズで段階導入する。
