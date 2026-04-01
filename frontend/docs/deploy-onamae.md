# お名前.comレンタルサーバー デプロイ手順

このドキュメントでは、creava-platform を **お名前.comレンタルサーバー（共有）** へデプロイする手順を説明します。

---

## 前提

| 項目 | 内容 |
|---|---|
| ホスティング | お名前.comレンタルサーバー（共有サーバー） |
| Webサーバー | Apache（mod_rewrite 対応） |
| デプロイ方式 | Vite の静的ビルド出力（dist/）を FTP/SSH でアップロード |
| SPA対応 | `.htaccess` による mod_rewrite フォールバック |

---

## 1. 本番用環境変数の設定

```bash
# テンプレートをコピー
cp .env.production.example .env.production
```

`.env.production` を開き、各値を本番用に書き換えてください。

| 変数名 | 説明 |
|---|---|
| `VITE_SITE_URL` | 本番ドメイン（例: `https://your-domain.com`） |
| `VITE_STRAPI_API_URL` | Strapi Cloud の API エンドポイント |
| `VITE_STRAPI_API_TOKEN` | Strapi Cloud の API トークン |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk の本番 Publishable Key（`pk_live_` から始まる） |
| `VITE_SHOPIFY_STORE_DOMAIN` | Shopify ストアドメイン（例: `your-store.myshopify.com`） |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Shopify Storefront API トークン |

> **注意**: `.env.production` は `.gitignore` に含めてください。絶対にコミットしないこと。

---

## 2. ローカルでの本番ビルド

```bash
# 依存パッケージのインストール（初回・更新時）
npm install

# 本番ビルド
npm run build:prod

# ビルド結果を手元で確認（任意）
npm run preview
```

ビルド完了後、`dist/` ディレクトリに以下が生成されます。

```
dist/
├── index.html          # エントリーポイント
├── .htaccess           # SPA ルーティング + キャッシュ設定
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── (その他 public/ の静的ファイル)
```

---

## 3. お名前.com側の事前設定

### 3-1. ドメイン・ネームサーバー確認

1. お名前.com ドメイン管理画面でネームサーバーがレンタルサーバー用に設定されているか確認
   - 例: `ns1.dns.ne.jp` / `ns2.dns.ne.jp`
2. DNS 変更後は最大 24〜72 時間の反映待ちが発生する場合あり

### 3-2. 独自SSL（無料SSL）の有効化

1. お名前.com サーバーコントロールパネル → **SSL設定** → 無料SSL（Let's Encrypt）を有効化
2. 有効化後、`https://` でアクセスできることを確認
3. SSL が有効になるまで数分〜数十分かかる場合あり

---

## 4. ファイルのアップロード

### アップロード対象

`dist/` ディレクトリ内の **すべてのファイル・ディレクトリ** をアップロードしてください。

```
アップロード対象: dist/ 以下のすべて
```

### 配置先ディレクトリ

お名前.comレンタルサーバーの公開ディレクトリは通常以下のどちらかです。

| パターン | 公開ディレクトリ |
|---|---|
| 標準 | `/home/[ユーザー名]/www/` または `/public_html/` |
| サブドメイン | `/home/[ユーザー名]/www/[サブドメイン]/` |

> サーバーコントロールパネルの **「ファイルマネージャー」** または **「Web公開フォルダー設定」** で確認してください。

### FTP でアップロードする場合

```
ホスト:     [お名前.comのFTPホスト名]
ユーザー名: [FTPアカウント]
パスワード: [FTPパスワード]
ポート:     21（または 990 for FTPS）
```

`dist/` の中身（`index.html`、`assets/`、`.htaccess` など）を公開ディレクトリ直下にアップロードしてください。

### SSH でアップロードする場合（レンタルサーバーがSSH対応の場合）

```bash
# rsync を使った一括アップロード（推奨）
rsync -avz --delete dist/ [ユーザー名]@[サーバーホスト]:/home/[ユーザー名]/www/

# または scp
scp -r dist/* [ユーザー名]@[サーバーホスト]:/home/[ユーザー名]/www/
```

---

## 5. `.htaccess` の確認

`dist/.htaccess` が公開ディレクトリのルートに配置されているか確認してください。

```
/public_html/
├── index.html    ← ここに配置
├── .htaccess     ← ここに配置（重要）
└── assets/
```

FTPクライアントによっては `.htaccess`（ドットファイル）が非表示になる場合があります。  
**「隠しファイルを表示する」** 設定を有効にしてアップロード・確認してください。

---

## 6. 反映確認手順

### 基本確認

1. `https://your-domain.com/` にアクセス → ホームページが表示されること
2. `https://your-domain.com/works` にアクセス → Worksページが表示されること
3. 詳細ページの直接アクセス確認（SPA ルーティングのテスト）
   - `https://your-domain.com/news/sample-slug` にアクセスしてページが表示されること
   - 404 ページにならないこと
4. ページリロードで 404 にならないことを確認

### 環境変数の確認

ブラウザの開発者ツール（Console）で API エラーが出ていないか確認してください。

- `[Strapi] ...` エラー → `VITE_STRAPI_API_URL` / `VITE_STRAPI_API_TOKEN` の確認
- `[Shopify] ...` エラー → `VITE_SHOPIFY_STORE_DOMAIN` / `VITE_SHOPIFY_STOREFRONT_TOKEN` の確認
- Clerk 関連エラー → `VITE_CLERK_PUBLISHABLE_KEY` の確認（本番キーか確認）

---

## 7. 不具合時の切り分けポイント

| 症状 | 確認箇所 |
|---|---|
| トップページが表示されない | `index.html` が公開ディレクトリのルートにあるか確認 |
| CSS/JSが読み込まれない | `assets/` ディレクトリがアップロードされているか確認 |
| 直接URLアクセスで404 | `.htaccess` が配置されているか / `mod_rewrite` が有効か確認 |
| APIエラーが出る | 環境変数が `.env.production` に正しく設定されているか確認。`npm run build:prod` でビルドし直す |
| https でアクセスできない | お名前.comコントロールパネルで SSL が有効になっているか確認 |
| Clerk ログインができない | Clerk ダッシュボードで本番ドメインが許可されているか確認 |
| Shopify 商品が表示されない | Shopify の Storefront API トークンが有効か / CORS 設定を確認 |

---

## 8. Clerk 本番設定の確認

Clerk ダッシュボードで以下を確認してください。

1. **Production インスタンス** を使用していること（Developmentキーは本番 NG）
2. **Allowed Origins** に本番ドメインが追加されていること
   - 例: `https://your-domain.com`
3. **Publishable Key** が `pk_live_` から始まっていること

---

## 9. GitHub Actions による自動デプロイ

`main` ブランチへのプッシュで自動的にビルド → FTP デプロイが実行されます。

### 必要な GitHub Secrets

リポジトリの **Settings → Secrets and variables → Actions** に以下を登録してください。

| Secret 名 | 内容 |
|---|---|
| `FTP_SERVER` | FTPサーバーホスト名（例: `ftp.your-domain.com`） |
| `FTP_USERNAME` | FTPユーザー名 |
| `FTP_PASSWORD` | FTPパスワード |
| `FTP_SERVER_DIR` | アップロード先パス（例: `/public_html/`）省略時は `/public_html/` |
| `VITE_SITE_URL` | 本番サイトURL |
| `VITE_STRAPI_API_URL` | Strapi Cloud APIエンドポイント |
| `VITE_STRAPI_API_TOKEN` | Strapi APIトークン |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk本番キー（`pk_live_`） |
| `VITE_SHOPIFY_STORE_DOMAIN` | Shopifyストアドメイン |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Shopify Storefront APIトークン |

### ワークフロー

| ファイル | トリガー | 内容 |
|---|---|---|
| `.github/workflows/ci.yml` | PR・`main` push | 型チェック + ビルド確認 |
| `.github/workflows/deploy.yml` | `main` push・手動 | ビルド + FTP デプロイ |

### 手動デプロイ

GitHub のリポジトリページ → **Actions** → **Deploy to お名前.com** → **Run workflow** で手動実行できます。

---

## 10. 将来 AWS へ移行する際に流用できる部分

このプロジェクトは静的ビルド出力（`dist/`）を前提としているため、AWS 移行は比較的シンプルです。

| 現在（お名前.com） | AWS 移行後 |
|---|---|
| `dist/` を FTP アップロード | S3 バケットにアップロード |
| `.htaccess` で SPA ルーティング | CloudFront のエラーページ設定（403/404 → `/index.html`）|
| お名前.com の無料SSL | AWS Certificate Manager (ACM) |
| 手動アップロード | GitHub Actions + `aws s3 sync` |

移行時に変更が必要なのは **デプロイ手順のみ** で、アプリケーションコードの変更は不要です。  
環境変数も同じキー名をそのまま使用できます。
