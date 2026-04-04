# Strapi 表示成立チェックリスト（ホームページ運用）

Home / Store / Latest を実データで崩さず運用するための最低限チェック。

## エンドポイント対応

- Settings: `/api/site-setting`
- Works: `/api/works`
- News: `/api/news-items`
- Blog: `/api/blog-posts`
- Events: `/api/events`
- Store: `/api/store-products`
- Fanclub: `/api/fanclub-contents`

## フロントで期待している主フィールド

### Settings (single)
- `siteName`
- `description`
- `ogImage` (media)

### Works
- `title`, `slug`, `publishAt`, `accessStatus`
- `thumbnail` (media)
- `isFeatured`
- case study 用（任意）: `caseStudyBackground`, `caseStudyGoal`, `caseStudyApproach`, `caseStudyImplementation`, `caseStudyResult`

### News / Blog / Fanclub
- `title`, `slug`, `publishAt`, `accessStatus`
- `thumbnail` (media, 任意)

### Events
- `title`, `slug`, `startAt`, `venue`, `accessStatus`

### Store
- `title`, `slug`, `price`, `currency`
- `previewImage` (media, 任意)
- `purchaseStatus` (`available` / `soldout` / `coming_soon`)
- `stripeLink`（Stripe主軸）
- `baseLink`（補助導線）
- `accessStatus`

## populate 指針

- Works: `thumbnail`
- News/Blog/Fanclub: `thumbnail`
- Store: `previewImage`
- Settings: `ogImage`

## 表示成立の運用ポイント

1. Home の Featured Works は 3〜4件を維持
2. Latest (News/Blog/Events) は最低1件ずつある状態を保つ
3. Store は `coming_soon` のみでも表示は成立
4. `fc_only` / `limited` を混ぜてアクセス制御の確認を行う
5. 画像あり / 画像なし両パターンを残す
