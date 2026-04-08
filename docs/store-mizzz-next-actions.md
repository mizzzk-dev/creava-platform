# store.mizzz.jp 立ち上げ・安定化: 現状調査・優先順位・実装結果

## 1. 現状調査結果

### frontend / backend の構成
- frontend は React + Vite + TypeScript。`VITE_SITE_TYPE=store` のとき `isStoreSite` 判定で store 専用ルーティングへ切替。
- backend は Strapi v5。`store-product` / `news-item` / `faq` / `site-setting` が既に定義済み。

### Strapi の既存 content type
- `store-product`（title/slug/price/currency/purchaseStatus/accessStatus/previewImage など）
- `news-item`（title/slug/body/thumbnail/accessStatus など）
- `faq`（question/answer/category/order）
- `site-setting`

### 既存 API クライアント
- `frontend/src/lib/api/client.ts` に共通 GET クライアントあり。
- 既に `response.ok` 判定・content-type 検証・HTML 応答判定・timeout・retry を実装済み。
- `useAsyncState` で開発時詳細ログ、本番安全メッセージの分離済み。

### 商品 / News / FAQ の既存有無
- 商品一覧・詳細、News 一覧・詳細は実装済み。
- FAQ は CMS 取得機構あり（未取得時に静的 FAQ を表示）。

### 既存共通 UI
- `ErrorState` / `NotFoundState` / `Skeleton*` / `PageHead` / `StructuredData` が共通部品として利用可能。

### サブドメイン `store.mizzz.jp` の受け先
- 同一 frontend コードベースを store ターゲットでビルドして配信する設計。
- デプロイ先は docs 上でロリポップを想定。

### 環境変数・API URL・CORS
- frontend: `VITE_STRAPI_API_URL`, `VITE_STRAPI_API_TOKEN`, `VITE_SITE_TYPE`, `VITE_SITE_URL`。
- backend: `FRONTEND_URL` に `https://store.mizzz.jp` を含めて CORS 許可。

### デプロイ方法
- frontend は build 後に FTP/GitHub Actions で配信。
- backend は Strapi Cloud。

### 既存不具合の影響範囲
- 明細ページ系は再試行操作がなく、一時障害時に復旧操作が弱い。
- fetch 中断時の明示的な signal 伝搬が不足（ページ離脱時の無駄リクエスト）。
- Strapi 商品編集時の保存前バリデーション（slug/price/image注意）の運用ガードが弱い。

---

## 2. そのまま使えるもの
- store 専用ルーティング基盤（`StoreLayout`, `Storefront*` ページ）。
- Strapi API クライアント基盤（timeout/retry/content-type 判定）。
- 商品カード、法務ページ、SEO コンポーネント。

## 3. 新規追加が必要なもの
- 商品運用バリデーションのサーバー側ガード（Strapi lifecycle）。
- 詳細ページの Retry 導線統一。
- store トップでの News / FAQ 導線強化。
- 仕様確定後の Product スキーマ拡張（sku/stock/seo/caution等）。

## 4. 先に直すべき不具合
1. API 中断・タイムアウト時の復旧導線不足。
2. 明細ページでの再試行 UI 欠落。
3. 管理画面で slug / price 品質を担保するチェック不足。

## 5. 作業ブランチ名
- `fix/store-api-stability`

---

## 6. 実装優先順位（今回の実施順）
1. API 取得の安定化（AbortController 伝搬、Retry 導線）
2. Store トップの主要導線（News / FAQ / Guide）
3. Strapi 管理運用の事前ガード（lifecycle）

---

## 7. 追加 / 修正ファイル一覧
- `frontend/src/lib/api/client.ts`
- `frontend/src/lib/api/strapi.ts`
- `frontend/src/hooks/useSlugDetail.ts`
- `frontend/src/modules/store/api.ts`
- `frontend/src/modules/store/hooks/useProductDetail.ts`
- `frontend/src/modules/news/api.ts`
- `frontend/src/pages/StoreDetailPage.tsx`
- `frontend/src/pages/NewsDetailPage.tsx`
- `frontend/src/pages/storefront/StorefrontHomePage.tsx`
- `backend/src/api/store-product/content-types/store-product/lifecycles.ts`（新規）
- `docs/store-mizzz-next-actions.md`

## 8. ルーティング一覧（store運用対象）
- `/`
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

## 9. CMS モデル一覧（現状）
- Product: `store-product`
- News: `news-item`
- FAQ: `faq`
- Site Settings: `site-setting`

※ `Collection / Category`, `Artist / Series` は将来拡張項目として未実装（仮定）。

## 10. API 一覧（frontend利用）
- `GET /api/store-products`
- `GET /api/store-products?filters[slug][$eq]=...`
- `GET /api/news-items`
- `GET /api/news-items?filters[slug][$eq]=...`
- `GET /api/faqs`
- `GET /api/site-setting`

## 11. 環境変数一覧（store立ち上げ最低限）
### frontend
- `VITE_SITE_TYPE=store`
- `VITE_SITE_URL=https://store.mizzz.jp`
- `VITE_STRAPI_API_URL`
- `VITE_STRAPI_API_TOKEN`
- `VITE_FORMSPREE_CONTACT_ID`
- `VITE_FORMSPREE_REQUEST_ID`
- `VITE_STRAPI_TIMEOUT_MS`（任意）
- `VITE_STRAPI_RETRY_COUNT`（任意）

### backend
- `FRONTEND_URL`（store ドメイン含む）
- `APP_KEYS`
- `API_TOKEN_SALT`
- `ADMIN_JWT_SECRET`
- `JWT_SECRET`
- `DATABASE_*`

## 12. エラー処理方針
- API クライアントで `response.ok` を必須判定。
- content-type が JSON 以外なら専用エラー化し、`Unexpected token <` を UI に露出しない。
- timeout + retry + AbortController をクライアント層で吸収。
- UI は `ErrorState` と `EmptyState` を分離。
- Retry ボタンを一覧・詳細で提供。
- 開発時は詳細ログ、本番は安全メッセージ。

## 13. SEO / 法務対応一覧
- Store 各ページで `PageHead` を使った title/description 管理。
- 商品詳細で Product / Breadcrumb 構造化データ。
- 法務ページ導線（`/guide`, `/terms`, `/privacy`, `/legal`）維持。

## 14. デプロイ確認項目
- `VITE_SITE_TYPE=store` で build が通る。
- Public 権限で `store-products`, `news-items`, `faqs`, `site-setting` を参照可能。
- `FRONTEND_URL` と backend CORS に store ドメインが含まれる。
- 商品一覧・詳細・News・FAQ が取得失敗時に Retry 可能。

## 15. 残課題
- Product モデル拡張（sku/stock/images複数/seo/caution/shipping/digital note）。
- 管理画面 quick actions の継続確認（現状は app.tsx で絵文字アイコン実装済み）。
- 商品複製/公開予約/販売終了日時などの編集体験向上。
- カート〜決済確定導線（Stripe/BASE）の最終仕様固定。

## 16. 仮定
- `Collection / Category` は現時点で `inferCollectionSlug` による推論運用を継続。
- 画像未設定は運用警告（warn）とし、保存を完全ブロックしない。
- スキーマ大幅変更は既存運用影響が大きいため今回は未実施。
