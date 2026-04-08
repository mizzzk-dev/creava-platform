# store.mizzz.jp 立ち上げ調査・実装メモ

作成日: 2026-04-08

## 1. 現状調査結果

- frontend は React + Vite + TypeScript。`VITE_SITE_TYPE=store` で store サイトルーティングに切り替わる。
- backend は Strapi v5。`store-product / news-item / faq / site-setting` を中心に store 表示に必要な API を提供。
- 既存で store 専用ページ群（`/`, `/products`, `/products/:handle`, `/guide`, `/shipping-policy`, `/returns`, `/legal`, `/terms`, `/privacy`）が存在。
- Strapi API 共通クライアントは `response.ok`、`content-type` 検証、timeout、retry、AbortController、HTML 応答混入判定を実装済み。
- store.mizzz.jp の受け先は frontend 側の `isStoreSite` 分岐。メインサイト `/store` はサブドメインへ誘導設計。

## 2. 実装優先順位

1. API / データ取得安定化（エラー安全化、Retry、タイムアウト/再試行）
2. Strapi 商品運用安定化（必須項目、slug/price/stock バリデーション、公開時の失敗防止）
3. ストア導線最小完成（トップ・一覧・詳細・ニュース・FAQ・法務・ガイド）
4. ヘッダー/フッターとお問い合わせ導線の統一（メインサイト contact へ）
5. テーマ切替・多言語導線の整備
6. SEO / 法務 / デプロイチェック

## 3. 追加 / 修正ファイル一覧

- `frontend/src/components/layout/StoreLayout.tsx`
- `frontend/src/hooks/useAsyncState.ts`
- `frontend/src/lib/routes.tsx`
- `frontend/src/pages/storefront/StorefrontContactRedirectPage.tsx`
- `frontend/src/pages/storefront/StorefrontGuidePage.tsx`
- `frontend/src/pages/storefront/StorefrontLegalPage.tsx`
- `frontend/src/pages/storefront/StorefrontShippingPolicyPage.tsx`
- `frontend/src/pages/storefront/StorefrontReturnsPage.tsx`
- `docs/store-mizzz-launch-audit-and-plan.md`

## 4. ルーティング一覧（store）

- `/` トップ
- `/products` 一覧
- `/products/:handle` 詳細
- `/collections/:slug` コレクション
- `/news`, `/news/:slug`
- `/faq`
- `/guide`
- `/shipping-policy`
- `/returns`
- `/contact`（メインサイトお問い合わせへリダイレクト）
- `/legal`
- `/terms`
- `/privacy`
- `/cart`

## 5. CMS モデル一覧

- Product (`store-product`)
  - `title`, `slug`, `sku`, `price`, `stock`, `previewImage`, `description`
  - `category`, `tags`, `featured`, `isNewArrival`, `sortOrder`, `publishAt`
  - `seoTitle`, `seoDescription`, `ogImage`
  - `cautionNotes`, `shippingNotes`, `digitalDeliveryNotes`
  - `purchaseStatus`, `accessStatus`, `limitedEndAt`, `archiveVisibleForFC`
- News (`news-item`)
- FAQ (`faq`)
- Site Settings (`site-setting`)

## 6. API 一覧

- `GET /api/store-products`（一覧）
- `GET /api/store-products?filters[slug][$eq]={slug}`（詳細）
- `GET /api/news-items`
- `GET /api/faqs`
- `GET /api/site-setting`

## 7. 環境変数一覧

- frontend
  - `VITE_SITE_TYPE`
  - `VITE_SITE_URL`
  - `VITE_MAIN_SITE_URL`
  - `VITE_STORE_SITE_URL`
  - `VITE_FANCLUB_SITE_URL`
  - `VITE_STRAPI_API_URL`
  - `VITE_STRAPI_API_TOKEN`
  - `VITE_STRAPI_TIMEOUT_MS`
  - `VITE_STRAPI_RETRY_COUNT`
- backend
  - `FRONTEND_URL`
  - `HOST`, `PORT`
  - `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`

## 8. エラー処理方針

- 共通 API クライアントで `response.ok` を必須判定。
- `content-type` が JSON 以外（HTML 混入含む）は `StrapiApiError` として変換。
- timeout/retry/AbortController を標準実装。
- `useAsyncState` で本番向けは安全メッセージ、開発環境は診断ログ詳細（URL, contentType, requestId, snippet）を出力。
- ErrorState と EmptyState を分離し、Retry ボタンを継続提供。

## 9. SEO / 法務対応一覧

- 各 store ページに `PageHead` を設定（title/description/canonical ベース）。
- 商品詳細は Product + Breadcrumb の JSON-LD を維持。
- 法務ページ導線（`/terms`, `/privacy`, `特商法`）を header/footer/guide/legal から到達可能に統一。
- `sitemap-store.xml` / `robots.txt` は既存運用を継続。

## 10. 多言語対応方針

- i18next（ja/en/ko）を継続利用。
- store ヘッダー/フッターに言語切替 UI を配置。
- ページ文言追加時は `ja/en/ko` 同時追加を原則化。
- 未翻訳は既存 i18next フォールバック（ja）を利用。

## 11. テーマ切替方針

- ThemeProvider の `system/light/dark` 3状態を継続。
- store ヘッダーに ThemeToggle を追加。
- localStorage 保存済み設定を優先し、未設定は system を採用。

## 12. ヘッダー / フッター設計方針

- ヘッダー: 商品導線、FAQ/Guide、カート、言語切替、テーマ切替、モバイルメニュー。
- フッター: 法務・配送・返品・FAQ・ガイド・お問い合わせ（メインサイト）を整理。
- ストア問い合わせは独自フォームを持たず `https://mizzz.jp/contact` へ統一。

## 13. デプロイ確認項目

- `VITE_SITE_TYPE=store` で frontend build 成功。
- Strapi CORS に `https://store.mizzz.jp` を含める。
- Public 権限で `store-products/news-items/faqs` の `find` を許可。
- `/products`, `/products/:slug`, `/news`, `/faq` の取得失敗時に ErrorState + Retry が動く。
- `/contact` から `https://mizzz.jp/contact` へ遷移する。

## 14. 残課題

- Strapi 管理画面の公開予約・販売終了日時の自動運用 UI。
- 商品複製の運用導線。
- OGP 未設定警告の管理画面 UI 表示。
- ストア専用 sitemap の多言語拡張。

## 15. 作成したブランチ名

- `feature/store-launch-base`

## 16. コミット一覧

- ストア問い合わせ導線とレイアウトを改善

## 17. PR本文案

### タイトル
store.mizzz.jp の導線最適化と API エラー表示の安定化

### 概要
- store.mizzz.jp の立ち上げ向けに、API エラー表示の安全化とストア共通導線を整備しました。
- ストア問い合わせは独自フォームを持たず、メインサイト問い合わせへ統一しました。

### 対応内容
- store ヘッダー/フッターに言語切替・テーマ切替・モバイル導線を追加
- `/contact` をメインサイト問い合わせページへのリダイレクトに変更
- ガイド・法務・配送・返品ページからの問い合わせ導線を統一
- 非同期 API エラーの本番向け安全メッセージと開発向け診断ログを整理

### 変更ファイル
- frontend: layout / routes / storefront pages / hooks
- docs: launch audit and implementation memo

### 確認手順
- `npm run lint --prefix frontend`
- `npm run build:frontend`
- `npm run build:backend`
- `VITE_SITE_TYPE=store` で `/contact` 遷移確認

### 未対応事項
- 管理画面の公開予約・商品複製 UI
- OGP 未設定アラート UI

### リスク / 注意点
- `MAIN_SITE_URL` が未設定の場合は既定値 `https://mizzz.jp` を参照するため、環境ごとの URL 差異に注意。

## 仮定

- store 問い合わせは当面メインサイトで一本化し、store 独自フォームは作成しない。
- Product のカテゴリ/タグは現行の string/json 運用を継続し、relation 化は次フェーズで判断。
