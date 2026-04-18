# SEO / コンテンツ流入 / ランディング最適化 基盤（2026-04）

## 1. 現在のSEO課題（実装確認ベース）
- canonical / hreflang が `location.pathname` 依存で、サイト別ドメイン（main/store/fc）を明示した URL 正規化が不十分。
- metadata はページごとにあるが、CMS 側での canonical/noindex/nofollow/OG 専用項目が不足し運用しづらい。
- structured data は FAQ / Article / Product などが中心で、CollectionPage / ItemList / ContactPage / ProfilePage など流入導線系が不足。
- 検索流入ページからの内部リンク導線が散在し、main/store/fc 横断の回遊を体系化しづらい。

## 2. 今回の改善内容（基盤）

### SEO基盤
- `PageHead` を拡張し、以下を追加。
  - canonical URL/path 上書き
  - noindex + nofollow 制御
  - keywords
  - OGP title / description 個別指定
- `frontend/src/lib/seo.ts` にサイト別 canonical/hreflang 生成を集約。

### 多言語SEO
- `ja/en/ko` の alternate をサイト別絶対 URL で一貫生成。
- `ja` を canonical、`en/ko` を `?lng=` 付き alternate として統一。

### structured data
- `StructuredData` の schema 対応拡張。
  - Organization
  - NewsArticle
  - Event
  - CollectionPage
  - ItemList
  - HowTo
  - ContactPage
  - ProfilePage
- main/store/fc のホーム系に CollectionPage / ItemList / ContactPage 等を適用。

### 内部リンク / 回遊導線
- `SeoInternalLinkSection` を追加し、
  - main ホーム
  - store ホーム
  - fc ホーム
 へ導線ハブを実装。
- 「検索流入 → 関連コンテンツ → CV（Contact/Join/Purchase）」への遷移を明示。

### robots / indexability
- robots を整理。
  - 認証・会員・カート・checkout 系を明示的に除外
  - sort/filter/page 系 query の重複クロール抑制
  - 3ドメインの sitemap を明示

### Strapi / CMS 拡張
`faq / guide / store-product` に以下を追加。
- ogTitle
- ogDescription
- canonicalUrl
- noindex
- nofollow
- breadcrumbLabel
- structuredDataJson

フロント型/API 取得項目も追従済み。

## 3. index 方針（運用）
### index 推奨
- main: home/about/news/blog/events/faq/contact/pricing/works
- store: home/products/product detail/news/faq/guide/policy
- fc: home/about/join/faq/guide/legal（会員専用は noindex）

### noindex 推奨
- login/mypage/callback/checkout/cart/preview
- 会員限定 detail（公開範囲が members/premium のもの）

## 4. DNS/Secrets/env 変更要否
- DNS 変更: **不要**
- 新規 SaaS: **不要**
- 新規 GitHub Secrets/Variables: **不要**
- env 追加: **不要**（既存 `VITE_MAIN_SITE_URL/VITE_STORE_SITE_URL/VITE_FANCLUB_SITE_URL` を活用）

## 5. staging/production 確認手順
1. 各サイトで `<head>` を確認（title/description/canonical/hreflang/robots）。
2. JSON-LD を Rich Results Test 相当で確認。
3. robots / sitemap を実 URL で確認。
4. 会員ページ・checkoutページが index されないことを確認。
5. main/store/fc 横断リンクで遷移崩れがないことを確認。

## 6. 残課題（次PR）
- sitemap の自動生成（CMS連動）
- page type 別 noindex ルールの共通ヘルパ化
- Search Console / 分析イベントと連動した SEO レポート自動化
- locale ごとの未翻訳 fallback 判定と noindex ガードの自動化

## 仮定
- locale URL を `?lng=` で表現する現行仕様を継続。
- 既存分析基盤（tracking.ts）を継続利用し、新規計測キー追加は次PRで対応。
