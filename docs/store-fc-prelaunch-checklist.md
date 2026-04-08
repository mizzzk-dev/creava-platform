# store.mizzz.jp / fc.mizzz.jp 公開前チェックリスト

最終更新: 2026-04-08

## 1. 事前準備（環境・設定）
- [ ] `VITE_SITE_TYPE` がデプロイ先（`store` / `fanclub`）に一致している。
- [ ] `VITE_SITE_URL` が対象サブドメイン URL と一致している。
- [ ] `VITE_MAIN_SITE_URL=https://mizzz.jp`、`VITE_STORE_SITE_URL=https://store.mizzz.jp`、`VITE_FANCLUB_SITE_URL=https://fc.mizzz.jp` を設定済み。
- [ ] `VITE_STRAPI_API_URL` / `VITE_STRAPI_API_TOKEN` が本番値で設定済み。
- [ ] FC 環境では `VITE_CLERK_PUBLISHABLE_KEY` が本番値で設定済み。
- [ ] backend の `FRONTEND_URL` / CORS / API Token / DB 接続値が本番値。

## 2. 共通UI・導線
- [ ] Header / Footer の崩れがない（PC / SP）。
- [ ] `mizzz.jp` / `store.mizzz.jp` / `fc.mizzz.jp` の相互導線が有効。
- [ ] 問い合わせ導線が `https://mizzz.jp/contact` に統一。
- [ ] 言語切替（ja / en / ko）で主要 UI 文言が欠落しない。
- [ ] テーマ切替（light / dark）で可読性が維持される。

## 3. store.mizzz.jp QA
- [ ] `/`（Store Home）表示、CTA、最新導線が正常。
- [ ] `/products` 商品一覧の絞り込み / 在庫ステータス表示が正常。
- [ ] `/products/:handle` 商品詳細の価格・在庫・購入導線が正常。
- [ ] 0件時 EmptyState、API 失敗時 ErrorState / Retry が機能。
- [ ] `/news` `/faq` `/guide` `/shipping-policy` `/returns` `/legal` が表示可能。
- [ ] `/contact` で `mizzz.jp/contact` へ遷移する。

## 4. fc.mizzz.jp QA
- [ ] `/`（Fanclub Home）表示が正常。
- [ ] `/join` / `/login` の導線が自然で、文言崩れがない。
- [ ] 未ログイン時に `/mypage` 等の保護ページへ直接遷移するとガードが働く。
- [ ] ログイン後に `/mypage` を表示できる。
- [ ] `/news` `/blog` `/events` `/faq` が表示可能。
- [ ] 限定ページが noindex 指定され、公開ページのみ index 対象。

## 5. SEO / メタデータ
- [ ] 各主要ページで `title` / `description` / `canonical` が設定される。
- [ ] OGP（`og:title` `og:description` `og:image` `og:locale`）が出力される。
- [ ] `hreflang`（ja/en/ko/x-default）が主要ページで出力される。
- [ ] `robots.txt` が意図どおり（`/preview` と認証系を除外）。
- [ ] `sitemap.xml` と `sitemaps/sitemap-*.xml` の URL が実環境と一致。

## 6. エラー導線 / 安全性
- [ ] API エラー時に `Unexpected token <` が露出しない。
- [ ] timeout / retry が機能し、ユーザー向けメッセージが安全。
- [ ] 404（存在しない URL）で NotFound が表示される。
- [ ] 500 相当（API障害）でも内部情報を表示しない。

## 7. ビルド前最終確認
- [ ] `npm run test:frontend`
- [ ] `npm run lint --prefix frontend`
- [ ] `npm run check:i18n --prefix frontend`
- [ ] `npm run build:frontend`
- [ ] `npm run build:backend`

## 8. 公開直後の確認手順（リリース後10〜30分）
1. store / fc のトップ表示を確認。
2. 言語切替（ja/en/ko）とテーマ切替を確認。
3. store で商品一覧・商品詳細・カート導線を確認。
4. fc でログイン導線・保護ページガード・マイページ表示を確認。
5. `robots.txt` / `sitemap.xml` / OGP を実 URL で確認。
6. エラーログ（frontend / Strapi）に重大エラーがないことを確認。

## 9. 運用メモ（Strapi）
- 商品公開時は slug / 価格 / 在庫 / 画像の入力警告を必ず確認。
- 公開状態（Draft/Publish）と FC 限定フラグを公開前にダブルチェック。
- 更新後は store / fc 両サブドメインで実表示確認を行う。
