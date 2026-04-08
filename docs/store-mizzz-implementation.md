# store.mizzz.jp 実装メモ（Phase 1）

## 1. 実装方針の要約
- 既存 monorepo（React + Vite / Strapi v5）を維持し、`VITE_SITE_TYPE=store` 時のみストア専用ルーティングを有効化。
- 既存の商品API・カート・ニュース・FAQ・法務ページを再利用し、最小差分で `store.mizzz.jp` の運用を開始。
- HTML 混入やタイムアウト時の防御は既存 Strapi API クライアントを継続利用。

## 2. ページ一覧
- `/` ストアトップ
- `/products` 全商品一覧
- `/products/:handle` 商品詳細
- `/collections/:slug` コレクション一覧
- `/news`, `/news/:slug`
- `/faq`
- `/guide`
- `/shipping-policy`
- `/returns`
- `/contact`
- `/legal/terms`, `/legal/privacy-policy`, `/legal/tokushoho`
- `/cart`

## 3. コンポーネント一覧
- `StoreLayout`（ストア専用ヘッダー/フッター）
- `StorefrontHomePage`
- `StorefrontProductsPage`
- `StorefrontCollectionPage`
- `StorefrontGuidePage`
- `StorefrontShippingPolicyPage`
- `StorefrontReturnsPage`
- 既存 `ProductCard`, `ErrorState`, `SkeletonProductCard`, `PageHead` を再利用

## 4. CMS モデル一覧
Phase 1 は既存 `store-product` を利用。

今後追加推奨:
- `store-collection`
- `store-artist`
- `store-series`
- `store-news`（既存 news-item 統合可）
- `store-faq`（既存 faq 統合可）
- `store-site-setting`

## 5. API 一覧
- `GET /api/store-products`
- `GET /api/store-products?filters[slug][$eq]=...`
- `GET /api/news-items`
- `GET /api/faqs`
- `GET /api/site-setting`

## 6. 環境変数一覧
- `VITE_SITE_TYPE=store`
- `VITE_SITE_URL=https://store.mizzz.jp`
- `VITE_MAIN_SITE_URL=https://mizzz.jp`
- `VITE_STORE_SITE_URL=https://store.mizzz.jp`
- `VITE_FANCLUB_SITE_URL=https://fc.mizzz.jp`
- `VITE_STRAPI_API_URL`
- `VITE_STRAPI_API_TOKEN`（必要時）
- `VITE_STRAPI_TIMEOUT_MS`
- `VITE_STRAPI_RETRY_COUNT`

## 7. ルーティング一覧
- ストア専用ルートは `AppRoutes` 内で `isStoreSite` 分岐。
- メインサイトの `/store/*` は従来通りサブドメイン誘導を維持。

## 8. エラー処理方針
- API 失敗時は `ErrorState` にユーザー向けメッセージ表示 + Retry。
- JSON 以外のレスポンスは `StrapiApiError` で文脈付き変換。
- 開発時のみ診断ログ出力、本番で詳細露出しない。

## 9. SEO 方針
- ストアトップ / 商品一覧 / ガイド系に `PageHead` を適用。
- 商品詳細は既存 Product / Breadcrumb の JSON-LD を継続使用。
- canonical は `VITE_SITE_URL` を起点。

## 10. デプロイ手順
1. `frontend/.env.production` に store 用値を設定。
2. `VITE_SITE_TYPE=store` でビルド。
3. `store.mizzz.jp` の DNS / SSL を配備。
4. CDN キャッシュ後に `/`, `/products`, `/products/:handle` を疎通確認。

## 11. 確認手順
- `npm run lint --prefix frontend`
- `npm run build:frontend`
- ストアトップから商品詳細まで 3クリック以内で遷移確認
- エラー時 Retry UI の表示確認（API URL を一時的に不正化）

## 12. 残課題一覧
- Strapi 側のコレクション/アーティスト/シリーズの正式スキーマ追加
- 商品タグ・価格帯フィルタのCMS管理化
- マイページ導線（注文履歴・デジタル購入履歴）の実装
- お気に入り機能（Phase 2）
- Store用 sitemap の拡張

## 仮定
- Phase 1 では既存 `store-product` のみで運用開始する。
- 参考体験の要件は情報設計を優先し、意匠は mizzz 用に独自化する。
