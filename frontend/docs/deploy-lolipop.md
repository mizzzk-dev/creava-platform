# ロリポップレンタルサーバー デプロイ手順（最終版）

creava-platform をロリポップレンタルサーバーへ公開するための完全手順です。

---

## 前提

| 項目 | 内容 |
|---|---|
| ホスティング | ロリポップ！レンタルサーバー（スタンダード以上推奨） |
| Webサーバー | Apache（mod_rewrite 対応） |
| デプロイ方式 | Vite の静的ビルド出力（`dist/`）を FTP でアップロード |
| SPA 対応 | `.htaccess` による mod_rewrite フォールバック |

---

## 初回デプロイ手順

### STEP 1｜ロリポップ側の事前設定

#### 1-1. 独自ドメイン設定

1. ロリポップ ユーザー専用ページ（管理パネル）へログイン
2. **サーバーの管理・設定 → 独自ドメイン設定** を開く
3. 使用するドメインを追加し、公開ディレクトリを設定する
   - 例: `your-domain.com` → `/home/[ユーザー名]/[ドメイン名]/`
4. ドメイン側のネームサーバーをロリポップの指定値に変更する（DNSの反映に最大24〜72時間かかる場合あり）

#### 1-2. 無料 SSL（Let's Encrypt）の有効化

1. **サーバーの管理・設定 → SSL設定** を開く
2. 対象ドメインの **「無料独自SSL」** を有効化する
3. 有効化後に `https://` でアクセスできるまで数分〜数十分かかる場合あり

> SSL が有効になる前にサイトを公開しても構いません。有効化後に自動で HTTPS に切り替わります。

#### 1-3. FTP 情報の確認

ロリポップの管理パネルで以下を確認してください。

| 項目 | 確認場所 |
|---|---|
| FTPホスト名 | `ftp.lolipop.jp` （固定） |
| FTPユーザー名 | ユーザー専用ページ → **FTP情報** |
| FTPパスワード | 契約時のパスワード（管理パネルから変更可） |
| 公開ディレクトリ | `/home/[ユーザー名]/[ドメイン名]/` |

---

### STEP 2｜本番用環境変数の設定

```bash
cp .env.production.example .env.production
```

`.env.production` を開き、各値を本番用に書き換えてください。

| 変数名 | 説明 |
|---|---|
| `VITE_SITE_URL` | 本番 URL（例: `https://your-domain.com`） |
| `VITE_STRAPI_API_URL` | Strapi Cloud の API エンドポイント |
| `VITE_STRAPI_API_TOKEN` | Strapi Cloud の API トークン |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk の本番キー（`pk_live_` から始まる） |
| `VITE_SHOPIFY_STORE_DOMAIN` | Shopify ストアドメイン（例: `your-store.myshopify.com`） |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Shopify Storefront API トークン |
| `VITE_FORMSPREE_CONTACT_ID` | Formspree お問い合わせフォームID |
| `VITE_FORMSPREE_REQUEST_ID` | Formspree 仕事依頼フォームID |

> `.env.production` は `.gitignore` に含まれています。**絶対にコミットしないこと。**

---

### STEP 3｜ローカルで本番ビルド

```bash
npm install           # 初回・パッケージ更新時のみ
npm run build:prod    # 本番ビルド
```

ビルド完了後、`dist/` ディレクトリに以下が生成されます。

```
dist/
├── index.html
├── .htaccess          ← SPA ルーティング設定（重要）
└── assets/
    ├── index-[hash].js
    ├── index-[hash].css
    └── ...
```

ビルド前に型エラーがないことを確認したい場合:

```bash
npx tsc --noEmit
```

---

### STEP 4｜ファイルのアップロード（FTP）

#### FTPクライアントの設定（FileZilla 推奨）

| 項目 | 値 |
|---|---|
| ホスト | `ftp.lolipop.jp` |
| ユーザー名 | ロリポップのFTPユーザー名 |
| パスワード | ロリポップのFTPパスワード |
| ポート | `21` |
| 暗号化 | 明示的な FTP over TLS（FTPES）推奨 |

#### アップロード手順

1. `dist/` ディレクトリの中身（`index.html`・`assets/`・`.htaccess`）を選択
2. ロリポップの公開ディレクトリ（`/home/[ユーザー名]/[ドメイン名]/`）へアップロード
3. **`.htaccess` が含まれているか必ず確認する**（FTPクライアントが隠しファイルを非表示にしている場合は「隠しファイルを表示」を有効化）

#### アップロード後の公開ディレクトリ構成

```
/home/[ユーザー名]/[ドメイン名]/
├── index.html
├── .htaccess    ← これがないと SPA ルーティングが壊れる
└── assets/
```

---

### STEP 5｜外部サービスの本番設定

#### Clerk

1. Clerk ダッシュボード → **Production** インスタンスを使用していることを確認
2. **Allowed Origins** に本番ドメインを追加
   - 例: `https://your-domain.com`
3. Publishable Key が `pk_live_` から始まることを確認

#### Shopify

1. Shopify 管理画面 → **アプリと販売チャネル → Headless** （または Storefront API）
2. Storefront API トークンの **許可ドメイン** に本番ドメインを追加
   - 例: `https://your-domain.com`

#### Strapi

1. Strapi Cloud ダッシュボード → **Settings → CORS**
2. `Allowed Origins` に本番ドメインを追加
   - 例: `https://your-domain.com`

#### Formspree

1. Formspree ダッシュボードで各フォームの **Allowed Origins** または **Whitelist** に本番ドメインを追加（プランによって設定箇所が異なる）

---

### STEP 6｜公開確認チェックリスト

以下をすべて確認してから公開完了とします。

#### ビルド・アップロード確認

- [ ] `npm run build:prod` がエラーなく完了した
- [ ] `dist/` ディレクトリにファイルが生成されている
- [ ] `dist/.htaccess` が存在する
- [ ] 公開ディレクトリに `index.html` / `.htaccess` / `assets/` がアップロードされている

#### HTTPS・基本表示確認

- [ ] `https://your-domain.com/` にアクセスしてホームページが表示される
- [ ] ブラウザのアドレスバーに鍵マーク（HTTPS）が表示されている
- [ ] CSS / JS が正常に読み込まれている（デザインが崩れていない）

#### SPA ルーティング確認

- [ ] `https://your-domain.com/works` に直接アクセスしてページが表示される（404にならない）
- [ ] 詳細ページ `https://your-domain.com/blog/[slug]` に直接アクセスできる
- [ ] ページをリロードしても 404 にならない

#### API 接続確認

- [ ] ブラウザの DevTools（Console）に API エラーが出ていない
- [ ] Works / Blog / News ページにコンテンツが表示される（Strapi）
- [ ] Store ページに商品が表示される（Shopify）

#### 認証・アクセス制御確認

- [ ] Clerk ログインボタンが表示される
- [ ] ログイン → サインイン → ファンクラブページへのアクセスが正常に動作する
- [ ] 未ログイン時にファンクラブコンテンツが表示されない

#### フォーム確認

- [ ] お問い合わせフォームから送信できる（Formspree でメール受信を確認）
- [ ] 仕事依頼フォームから送信できる（同上）

#### エラー表示確認

- [ ] 存在しない URL（例: `/does-not-exist`）にアクセスすると 404 ページが表示される
- [ ] コンソールに意図しないエラーが出ていない

---

## 更新デプロイ手順

コードを変更した後のデプロイ手順です。

```bash
# 1. コードを修正・コミット
git add .
git commit -m "変更内容の説明"

# 2. 本番ビルド
npm run build:prod

# 3. dist/ の中身を FTP でアップロード（差分のみでも可）
```

> **GitHub Actions を使っている場合**: `main` ブランチへ push するだけで自動ビルド＋FTPデプロイが実行されます。

---

## GitHub Actions による自動デプロイ

`main` ブランチへの push で自動デプロイが走ります。

### 必要な GitHub Secrets

リポジトリの **Settings → Secrets and variables → Actions** に登録してください。

| Secret 名 | 内容 |
|---|---|
| `FTP_SERVER` | `ftp.lolipop.jp` |
| `FTP_USERNAME` | ロリポップの FTP ユーザー名 |
| `FTP_PASSWORD` | ロリポップの FTP パスワード |
| `FTP_SERVER_DIR` | `/home/[ユーザー名]/[ドメイン名]/` |
| `VITE_SITE_URL` | `https://your-domain.com` |
| `VITE_STRAPI_API_URL` | Strapi Cloud の API エンドポイント |
| `VITE_STRAPI_API_TOKEN` | Strapi API トークン |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk 本番キー（`pk_live_`） |
| `VITE_SHOPIFY_STORE_DOMAIN` | Shopify ストアドメイン |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Shopify Storefront API トークン |
| `VITE_FORMSPREE_CONTACT_ID` | Formspree お問い合わせフォームID |
| `VITE_FORMSPREE_REQUEST_ID` | Formspree 仕事依頼フォームID |

---

## よくあるミス

| 症状 | 原因と対処 |
|---|---|
| トップページは開くが他ページで 404 | `.htaccess` が配置されていない。FTP で隠しファイルを表示して確認 |
| CSS / JS が読み込まれない | `assets/` ディレクトリがアップロードされていない |
| API エラーが出る（Console） | `.env.production` の値が間違っているか、`npm run build:prod` を再実行していない |
| `https://` でアクセスできない | ロリポップ管理パネルで SSL 設定が有効になっているか確認。有効化後は数分待つ |
| Clerk ログインができない | Clerk ダッシュボードの Allowed Origins に本番ドメインが追加されているか確認 |
| Shopify 商品が表示されない | Storefront API トークンのドメイン許可設定を確認 |
| フォームが送信できない | Formspree の ID が正しいか。ビルドし直して再アップロード |
| ファンクラブページにアクセスできない | Clerk が本番インスタンス（`pk_live_`）で設定されているか確認 |

---

## 将来の AWS 移行について

このプロジェクトは静的ビルド（`dist/`）を前提としているため、AWS 移行は比較的シンプルです。

| 現在（ロリポップ） | AWS 移行後 |
|---|---|
| `dist/` を FTP アップロード | S3 バケットに `aws s3 sync dist/ s3://[bucket]/` |
| `.htaccess` で SPA ルーティング | CloudFront のカスタムエラーページ（403/404 → `/index.html` に 200 で返す） |
| ロリポップの無料 SSL | AWS Certificate Manager（ACM）で証明書発行 |
| 手動 FTP アップロード | GitHub Actions + `aws s3 sync` + CloudFront キャッシュ無効化 |
| ロリポップのコントロールパネル | AWS コンソール / CloudFront ディストリビューション設定 |

**移行時に変更が必要なのはデプロイ手順のみ。アプリケーションコードの変更は不要。**
環境変数のキー名もそのまま使用できます。

### WordPress 移行について

フロントエンドを WordPress に移行する場合：

| 項目 | 対応 |
|---|---|
| コンテンツ | Strapi のデータを WordPress にエクスポート（WP REST API / XML インポート） |
| 認証 | Clerk を WP ユーザー管理に切り替え（または WooCommerce Memberships） |
| ストア | Shopify を WooCommerce に切り替えるか、Shopify Buy Button を埋め込む |
| フォーム | Contact Form 7 または WPForms で置き換え |
| テンプレート | 現在の UI デザインを参考に WordPress テーマを構築 |
