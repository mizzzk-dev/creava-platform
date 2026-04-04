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
| フロントエンド Repo | https://github.com/mizzz-dev/creava-platform |
| Strapi Cloud ダッシュボード | https://cloud.strapi.io |
| Formspree 受信確認 | https://formspree.io/forms |
| GitHub Actions | https://github.com/mizzz-dev/creava-platform/actions |

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
