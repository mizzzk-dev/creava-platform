# Creava CMS 運用ガイド

Strapi v5 管理画面の日常運用手順をまとめたガイドです。

---

## クイックアクセス

| 操作 | パス |
|------|------|
| ニュースを追加 | Collection Types → News Items → Create new entry |
| ブログを追加 | Collection Types → Blog Posts → Create new entry |
| 作品を追加 | Collection Types → Works → Create new entry |
| イベントを追加 | Collection Types → Events → Create new entry |
| ファンクラブ記事を追加 | Collection Types → Fanclub Contents → Create new entry |
| 商品を追加 | Collection Types → Store Products → Create new entry |
| メディア管理 | Media Library |

---

## コンテンツ公開フロー

1. **新規作成** → 必須フィールドを入力
2. **下書き保存** → 右上「Save」
3. **公開** → 右上「Publish」
4. **フロント確認** → 本番サイト (https://mizzz.jp) で確認

### アクセス制御フィールド
- `accessStatus: public` — 誰でも閲覧可能
- `accessStatus: limited` — 期間限定公開（`availableFrom` / `availableUntil` を設定）
- `accessStatus: fc_only` — ファンクラブ会員のみ

---

## コンテンツタイプ別チェックリスト

### ニュース / ブログ投稿
- [ ] タイトル（必須）
- [ ] slug（必須・英数字・ハイフン）
- [ ] body（本文）
- [ ] thumbnail（OGP 画像）
- [ ] publishAt（公開日時）
- [ ] accessStatus（公開範囲）
- [ ] tags（タグ）

### 作品 (Works)
- [ ] タイトル（必須）
- [ ] slug（必須）
- [ ] category（video / photo / music / web）
- [ ] thumbnail
- [ ] description
- [ ] featured（Home に表示するか）
- [ ] publishAt

### イベント
- [ ] タイトル（必須）
- [ ] slug（必須）
- [ ] startAt / endAt（開催日時）
- [ ] venue（開催場所）
- [ ] ticketUrl（チケット URL）
- [ ] accessStatus

### 商品 (Store Products)
- [ ] タイトル（必須）
- [ ] handle（必須・Shopify ハンドル）
- [ ] price / currency
- [ ] thumbnail
- [ ] purchaseType（stripe / base / coming_soon / sold_out）
- [ ] stripePaymentLink または externalUrl

---

## 定期メンテナンス

### 週次
- 公開予定のイベントが正しく設定されているか確認
- Draft のまま放置されているコンテンツを確認

### 月次
- `limited` コンテンツの期限切れを確認（`availableUntil` が過去日のもの）
- 画像未設定のエントリを確認（thumbnail が空のもの）
- slug が重複していないか確認

---

## SEO チェック

各エントリ公開前に確認すること:

- `slug` が英数字・ハイフンのみであること
- `thumbnail` が設定されていること（OGP 画像として使用）
- `publishAt` が正しく設定されていること
- `body` の冒頭 120 文字が meta description として使われます

---

## 便利なリンク

| リンク | URL |
|--------|-----|
| 本番サイト | https://mizzz.jp |
| フロントエンド Repo | https://github.com/mizzzk-dev/creava-platform |
| Strapi Cloud ダッシュボード | https://cloud.strapi.io |
| Formspree 受信確認 | https://formspree.io/forms |
| GitHub Actions | https://github.com/mizzzk-dev/creava-platform/actions |

---

## トラブルシューティング

### コンテンツが表示されない
1. `accessStatus` が `public` になっているか確認
2. `publishAt` が未来日になっていないか確認
3. 「Publish」ボタンを押したか確認（Save だけでは公開されません）

### 画像が表示されない
1. Media Library で画像がアップロードされているか確認
2. `thumbnail` フィールドに画像が関連付けられているか確認

### API から 404 が返ってくる
1. コンテンツが Published 状態になっているか確認
2. slug が正しく設定されているか確認
3. Strapi Cloud のデプロイが完了しているか確認

---

## 初期データ投入ガイド

本番運用開始時に最低限投入すべきコンテンツです。

### 優先度 A（公開前に必須）

#### Site Settings（シングルタイプ）
1. Content Manager → Single Types → Site Setting → 開く
2. 以下を設定して Publish:
   - `siteName`: `Creava`
   - `description`: サイトの概要文（OGP に使用）
   - `ogImage`: OG デフォルト画像をアップロードして設定

#### Profile（シングルタイプ）
1. Content Manager → Single Types → Profile → 開く
2. 以下を設定して Publish:
   - `name`: 表示名
   - `bio`: 自己紹介文（About ページ連携用）
   - `bioShort`: 短い自己紹介（Hero や teaser 用）
   - `avatar`: プロフィール画像

#### Works（コレクション）
3〜5件の代表作品を投入します:
- `title`: 作品名
- `slug`: `mv-01` のような英数字スラッグ
- `category`: `video` / `photo` / `music` / `web`
- `isFeatured`: `true`（Home の Featured Works に表示）
- `thumbnail`: サムネイル画像（16:9 推奨）
- `description`: 200文字程度の説明
- `publishAt`: 公開日
- `accessStatus`: `public`

### 優先度 B（公開後 1 週間以内）

#### News Items
最近のお知らせを 2〜3件:
- `title` + `slug` + `body`（本文）+ `thumbnail`
- `publishAt` を実際の日付に設定
- `accessStatus: public`

#### Blog Posts
制作の裏側や技術記事を 1〜2件:
- 画像付きで内容が充実していると SEO に有利
- `tags` でカテゴリ分け推奨

#### Events（開催予定がある場合）
- `startAt` は必須
- `bookingStatus`: `open` / `closed` / `soldout` / `free`

### 優先度 C（FC 開設時）

#### Fanclub Contents
- `accessStatus: fc_only` に設定
- `category`: `diary` / `exclusive` / `behind_scenes` 等
- FC 会員向けの独占コンテンツから始める

#### Store Products（Stripe 連携時）
- `stripeLink` に Stripe Payment Link の URL を設定
- `purchaseStatus`: `available` / `coming_soon`
- `previewImage` を必ず設定

### 画像アップロードの注意点
| 用途 | 推奨サイズ | フォーマット |
|------|-----------|------------|
| OG デフォルト | 1200×630px | PNG/JPG |
| Works サムネイル | 1280×720px (16:9) | JPG/WebP |
| Blog/News サムネイル | 1200×630px | JPG/WebP |
| ストア商品画像 | 800×800px (1:1) | JPG/WebP |
| プロフィール | 400×400px | JPG/WebP |

### slug 命名規則
- 英数字・ハイフンのみ（スペース・日本語不可）
- 例: `mv-brand-2024`, `photo-event-001`, `web-portfolio-v2`
- 変更すると URL が変わるため、公開後は変更しない

---

## コンテンツスキーマ早見表

| コンテンツ型 | API | 主なフィールド |
|------------|-----|-------------|
| News | `/api/news-items` | title, slug, body, thumbnail, publishAt, accessStatus |
| Blog | `/api/blog-posts` | title, slug, body, thumbnail, publishAt, tags, accessStatus |
| Works | `/api/works` | title, slug, description, category, isFeatured, thumbnail, externalUrl, accessStatus |
| Events | `/api/events` | title, slug, startAt, endAt, venue, bookingLink, bookingStatus, accessStatus |
| Fanclub | `/api/fanclub-contents` | title, slug, category, body, thumbnail, accessStatus |
| Store | `/api/store-products` | title, slug, price, currency, stripeLink, purchaseStatus, previewImage, accessStatus |
| Profile | `/api/profile` | name, bio, bioShort, avatar |
| Settings | `/api/site-setting` | siteName, description, ogImage |
