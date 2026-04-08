# store.mizzz.jp 立ち上げ調査・実装メモ

作成日: 2026-04-08

## 1. 現状調査結果（構成要約）

- frontend: React + Vite + TypeScript の SPA。`VITE_SITE_TYPE` で main/store/fanclub を切り替え、store サイトでは `StoreLayout` + storefront ページ群を利用。
- backend: Strapi v5。`store-product`, `news-item`, `faq`, `site-setting` を含む content type を提供。
- store サイトルーティングは既に実装済み（`/`, `/products`, `/products/:handle`, `/news`, `/news/:slug`, `/faq`, `/guide`, `/shipping-policy`, `/returns`, `/contact`, `/legal`, `/terms`, `/privacy`）。
- CORS は `store.mizzz.jp` を許可済み。`FRONTEND_URL` 追加入力にも対応。
- デプロイはロリポップ（フロント3系統）+ Strapi Cloud（API）前提の手順が docs に整備済み。

## 2. そのまま使えるもの

- store サイト分岐ルーティング。
- Store Top / Products / Detail / Guide / Shipping / Returns / Legal ページ。
- API クライアントの基盤（timeout/retry/AbortController/JSON判定/開発時ログ）。
- News/FAQ 取得 API と fallback 設計。
- SEO コンポーネント（`PageHead`, `StructuredData`）。

## 3. 新規追加が必要なもの

- Product schema の運用項目拡張（stock/category/tags/sortOrder/featured/isNewArrival/seo/注意事項など）。
- 商品一覧のタグ絞り込み・並び替え。
- 商品カード/詳細での在庫・運用メモ表示。
- Store API 取得時の軽量クエリ + レスポンス正規化。

## 4. 先に直すべき不具合

- Strapi lifecycle の `beforeUpdate` で部分更新時に create 相当の必須判定が走りうる問題（初回 Publish 不安定化要因）。
- store-product schema と lifecycle の想定項目不一致（featured/isNewArrival/sortOrder 等）。
- 開発中に `Unexpected token <` が生で表示される余地（UI メッセージの安全化）。

## 5. 作業ブランチ名

- `feature/store-api-stability`

## 6. 実装優先順位

1. API/データ取得の安定化（クエリ軽量化・レスポンス正規化・UI安全エラー）
2. Strapi 商品モデル/ライフサイクルの整合化（Publish 安定化）
3. 商品導線の最低機能（タグ絞り込み・並び替え・在庫表示）
4. SEO/法務・運用最終確認

## 7. 追加/修正ファイル一覧

- `frontend/src/modules/store/api.ts`
- `frontend/src/modules/store/types.ts`
- `frontend/src/lib/mock/store-products.ts`
- `frontend/src/pages/storefront/StorefrontProductsPage.tsx`
- `frontend/src/modules/store/components/ProductCard.tsx`
- `frontend/src/pages/StoreDetailPage.tsx`
- `frontend/src/hooks/useAsyncState.ts`
- `backend/src/api/store-product/content-types/store-product/schema.json`
- `backend/src/api/store-product/content-types/store-product/lifecycles.ts`
- `docs/store-mizzz-launch-audit-and-plan.md`

## 8. ルーティング一覧（store 対象）

- `/` (store top)
- `/products`
- `/products/:handle`
- `/collections/:slug`
- `/news`
- `/news/:slug`
- `/faq`
- `/guide`
- `/shipping-policy`
- `/returns`
- `/contact`
- `/legal`
- `/terms`
- `/privacy`
- `/cart`

## 9. CMSモデル一覧（store 起点）

- Product (`store-product`)
  - 既存 + 今回整備: `title`, `slug`, `sku`, `price`, `stock`, `previewImage`, `description`, `category`, `tags`, `featured`, `isNewArrival`, `publishAt`, `seoTitle`, `seoDescription`, `ogImage`, `cautionNotes`, `shippingNotes`, `digitalDeliveryNotes`, `sortOrder`
- News (`news-item`)
- FAQ (`faq`)
- Site Settings (`site-setting`)

## 10. API一覧（store起点）

- `GET /api/store-products`（一覧）
- `GET /api/store-products?filters[slug][$eq]=...`（詳細）
- `GET /api/news-items`
- `GET /api/faqs`
- `GET /api/site-setting`

## 11. 環境変数一覧（抜粋）

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
  - `FRONTEND_URL`（CORS 許可先追加）
  - `HOST`, `PORT`, `APP_KEYS`

## 12. エラー処理方針

- HTTP `response.ok` を必須判定。
- `content-type` が JSON 以外（HTML含む）なら専用エラー化。
- timeout/retry/AbortController を標準化。
- 開発環境は詳細ログ、本番は安全な汎用文言。
- `Unexpected token <` はそのまま表示せず、構成エラー案内に変換。
- ErrorState と EmptyState は表示分離、ErrorState には Retry を設置。

## 13. SEO / 法務対応一覧

- Store Top / Products / Guide / Shipping / Returns / Legal に `PageHead` を設定。
- Product 詳細に `Product schema` + `Breadcrumb schema` を設定。
- 法務導線（`/terms`, `/privacy`, `特商法`）を store 側で維持。
- canonical/sitemap/robots は既存の public 設定を継続利用。

## 14. デプロイ確認項目

- `store.mizzz.jp` 向け frontend build 成功
- Strapi CORS に `https://store.mizzz.jp` を含む
- Public 権限で `store-products/news-items/faqs` の `find` 可
- 商品作成→Publish が 1 回で成功
- 商品一覧/詳細/News/FAQ の表示
- エラー時 Retry UI 動作
- モバイル表示崩れなし

## 15. 残課題

- Strapi 管理画面の「商品複製」「公開予約」「販売終了自動制御」は未実装。
- Product の relation（Collection/Artist/Series）は将来拡張。
- OGP 未設定警告の管理画面 UI は未実装（ログ警告止まり）。
- E2E レベルの公開前総合試験は別途必要。

## 16. コミット一覧

- （このブランチでは 1 コミットに集約予定）

## 17. PR本文案

### タイトル
store.mizzz.jp のAPI安定化と商品運用基盤の初期整備

### 概要
- store.mizzz.jp 立ち上げに向け、見た目より先に API 安定性と CMS 運用の土台を整備。

### 対応内容
- 商品 API の軽量クエリ・レスポンス正規化・詳細取得項目整理
- 商品一覧にタグ絞り込み/並び順/在庫表示を追加
- 商品詳細に在庫・注意事項・配送/デジタル案内表示を追加
- Strapi Product schema を運用項目まで拡張
- lifecycle の publish 不安定化要因を修正
- `Unexpected token <` を UI で直接露出しないよう改善

### 変更ファイル
- frontend/store API・types・一覧/詳細 UI・mock
- backend/store-product schema/lifecycle
- 調査/実装メモ docs

### 確認手順
- `npm run lint --prefix frontend`
- `npm run build:frontend`
- `npm run build:backend`
- Store の `/products`, `/products/:slug`, `/news`, `/faq` 目視確認

### 未対応事項
- 商品複製/公開予約/販売終了日時の自動運用
- 管理画面での OGP 未設定の UI 警告

### リスク / 注意点
- schema 変更のため Strapi 側の migration 適用・権限確認が必要
- 既存データで新規項目が空の場合はフロント側デフォルト補完される

## 18. 仮定

- Product の `category/tags` は初期段階で string/json 運用し、relation 化は後続で行う。
- `stock` は単純整数在庫で管理し、バリエーション在庫管理は今回対象外とする。
- `publishAt` を新着優先判定の補助にしつつ、現段階は `sortOrder` を最優先とする。
