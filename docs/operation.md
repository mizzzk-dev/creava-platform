# 運用手順

creava-platform の公開後における日常的な更新・管理・トラブル対応の手順です。

---

## コード更新フロー

### 通常の更新（GitHub Actions 自動デプロイあり）

```
コード修正
  ↓
ローカルで動作確認（npm run dev）
  ↓
git commit & git push origin main
  ↓
GitHub Actions が自動ビルド → FTP デプロイ（約2〜3分）
  ↓
本番サイトで確認
```

### 手動デプロイが必要な場合

GitHub Actions が使えない場合や、緊急で反映したい場合。

```bash
# 1. 本番ビルド
npm run build:prod

# 2. FTP クライアント（FileZilla など）で dist/ を公開ディレクトリへアップロード
#    アップロード先: /home/[ユーザー名]/[ドメイン名]/
```

---

## コンテンツ更新フロー（Strapi）

コンテンツの追加・編集は Strapi Cloud のダッシュボードから行います。コードの変更は不要です。

### 更新手順

1. [Strapi Cloud](https://cloud.strapi.io) にログイン
2. 対象のコンテンツタイプを選択（Blog / News / Works / Fanclub）
3. 新規作成または既存コンテンツを編集
4. **「公開（Publish）」** をクリック

> 公開ボタンを押すと即座に本番サイトに反映されます（ビルド不要）。

### アクセス制御の設定

各コンテンツに以下のフィールドがあります。

| フィールド | 値 | 説明 |
|---|---|---|
| `visibility` | `public` | 誰でも閲覧可能 |
| `visibility` | `fc_only` | ファンクラブ会員（ログイン済み）のみ |
| `visibility` | `limited` | 期限付き公開（`publish_at` / `expires_at` で制御） |

---

## Shopify 商品管理

Shopify の管理画面から商品を追加・編集します。こちらもコードの変更は不要です。

1. [Shopify 管理画面](https://admin.shopify.com) にログイン
2. **商品 → 商品一覧** で商品を追加・編集・公開
3. 本番サイトのストアページに即座に反映される

---

## トラブル対応

### API が繋がらない（コンテンツが表示されない）

**確認手順:**

1. ブラウザの DevTools を開く（F12）→ **Console** タブを確認
2. エラーメッセージを確認する

| エラーの内容 | 対処 |
|---|---|
| `[Strapi]` または `401` / `403` | Strapi API トークンの有効期限切れの可能性。Strapi Cloud でトークンを再発行し、GitHub Secrets と `.env.production` を更新してビルド＆再デプロイ |
| `[Shopify]` または CORS エラー | Shopify Storefront API トークンのドメイン許可を確認。本番ドメインが Allowed Origins に入っているか確認 |
| `Network Error` / `Failed to fetch` | サーバーが落ちているか、URL が間違っている可能性。各サービスのダッシュボードでステータスを確認 |

---

### Clerk ログインができない

**確認手順:**

1. Clerk ダッシュボード → **Production** インスタンスを開く
2. **Domains** → 本番ドメイン（`https://your-domain.com`）が登録されているか確認
3. Publishable Key が `pk_live_` から始まっているか確認（`pk_test_` は開発用）

**よくあるケース:**

| 症状 | 対処 |
|---|---|
| ログインボタンを押しても何も起きない | コンソールで Clerk のエラーを確認。Allowed Origins に本番ドメインを追加 |
| ログイン後にエラー画面 | Clerk の Production インスタンスかどうか確認 |
| 会員ページにアクセスできない | ユーザーに member ロールが付与されているか Clerk ダッシュボードで確認 |

---

### フォームが送信できない

**確認手順:**

1. Formspree ダッシュボードでフォームが **有効（active）** になっているか確認
2. 送信先メールアドレスが正しく設定されているか確認
3. 無料プランの月100件制限に達していないか確認

**対処:**

| 症状 | 対処 |
|---|---|
| 送信してもメールが届かない | Formspree ダッシュボードで受信履歴を確認。迷惑メールフォルダも確認 |
| 送信エラーが表示される | `VITE_FORMSPREE_CONTACT_ID` / `VITE_FORMSPREE_REQUEST_ID` が正しいか確認し、再ビルド |

---

### 表示が崩れる

| 症状 | 対処 |
|---|---|
| デザインが崩れている（CSS がない） | `assets/` ディレクトリが正しくアップロードされているか FTP で確認 |
| 旧バージョンが表示される | ブラウザのキャッシュをクリア（Ctrl+Shift+R / Cmd+Shift+R） |
| 特定のページだけ崩れる | コンソールの JS エラーを確認。コンポーネントのエラーならコードを修正して再デプロイ |

---

### 直接 URL アクセスで 404 になる

SPA のルーティングが壊れています。

**確認:**

1. FTP で公開ディレクトリに `.htaccess` が存在するか確認（隠しファイル表示を有効に）
2. `.htaccess` が空でないか確認（`dist/.htaccess` の内容がコピーされているか）

**対処:**

```bash
# ローカルで dist/.htaccess を確認
cat dist/.htaccess

# 再ビルドして再アップロード
npm run build:prod
# → FTP で dist/.htaccess をアップロード
```

---

## 定期メンテナンス

### 月次確認（推奨）

- [ ] Strapi API トークンの有効期限確認
- [ ] Formspree の月次送信件数確認（無料プランは月100件）
- [ ] Shopify の Storefront API トークンの有効性確認
- [ ] 本番サイトの各ページを一通り動作確認

### パッケージ更新（任意）

```bash
# 古いパッケージを確認
npm outdated

# 安全な範囲で更新（メジャーバージョンアップは注意）
npm update

# ビルドが通ることを確認
npm run build:prod
```

---

## ロールバック手順

デプロイ後に問題が発生した場合、以前のバージョンに戻す手順です。

### GitHub Actions を使っている場合

1. GitHub リポジトリ → **Actions** → 以前の成功したデプロイを選択
2. **「Re-run all jobs」** で再実行

または:

```bash
# 直前のコミットに戻す
git revert HEAD
git push origin main
# → 自動デプロイが走る
```

### 手動デプロイの場合

1. Git で以前のコミットをチェックアウト

```bash
git log --oneline          # コミット一覧を確認
git checkout [commit-hash] -- .  # 該当バージョンに戻す
npm run build:prod
# → FTP で再アップロード
git checkout main          # main に戻す
```

---

## 外部サービスのダッシュボード一覧

| サービス | URL |
|---|---|
| Strapi Cloud | https://cloud.strapi.io |
| Clerk | https://dashboard.clerk.com |
| Shopify | https://admin.shopify.com |
| Formspree | https://formspree.io/forms |
| ロリポップ管理パネル | https://user.lolipop.jp |
| GitHub Actions | https://github.com/mizzzk-dev/creava-platform/actions |
