# ロリポップへのデプロイ手順

`frontend/` の Vite ビルド成果物をロリポップ（静的ホスティング）にデプロイする手順です。

## 前提

- ロリポップのスタンダードプラン以上（SSH / FTP アクセス可能）
- Node.js 20+ がローカルにインストール済み
- `frontend/.env.production` が設定済み

---

## 1. 本番ビルド

```bash
# frontend ディレクトリでビルド
cd frontend
npm run build:prod

# または root から
npm run build:frontend
```

`frontend/dist/` に静的ファイルが生成されます。

---

## 2. SPA ルーティング対応（.htaccess）

React Router を使っているため、`/works/sample-work` などのURLへの直接アクセスで  
404 にならないよう `.htaccess` が必要です。

`frontend/public/.htaccess` を作成（存在する場合は確認）:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

ビルド時に `dist/.htaccess` として自動コピーされます。

---

## 3. FTP でアップロード（手動）

### 接続情報の確認

ロリポップ管理画面 → ユーザー設定 → FTP 情報を確認:

- FTP サーバー: `ftp.lolipop.jp`
- ユーザー名: `xxx.xxx@lolipop.jp`
- パスワード: ロリポップのパスワード
- アップロード先: **`www/`**（FTP ルートから見た公開ディレクトリ）

> ⚠️ `httpdocs/` や `/public_html/` は cPanel の慣例であり、ロリポップには存在しません。  
> ロリポップの公開ディレクトリは FTP ルートの `www/` です。

### アップロード手順

1. FTP クライアント（FileZilla 等）で接続
2. `frontend/dist/` の**中身**を `www/` ディレクトリへアップロード

```
FTP ルート構成例:
/
├── log/
├── mail/
└── www/         ← ここに dist/ の中身を配置
    ├── index.html
    ├── .htaccess
    └── assets/
```

> ⚠️ `dist/` フォルダごとではなく、`dist/` の**中身**をアップロードしてください。  
> `www/dist/index.html` になると 404 になります。`www/index.html` が正しい配置です。

---

## 4. GitHub Actions による自動デプロイ

`.github/workflows/deploy.yml` で自動デプロイが設定されています。

### Secrets の設定

GitHub のリポジトリ設定 → Secrets and variables → Actions:

| Secret 名 | 値 | 備考 |
|---|---|---|
| `FTP_SERVER` | `ftp.lolipop.jp` | FTP サーバーアドレス |
| `FTP_USERNAME` | `xxx.xxx@lolipop.jp` | FTP ユーザー名 |
| `FTP_PASSWORD` | ロリポップのパスワード | FTP パスワード |
| `FTP_SERVER_DIR` | `www/` | 公開ディレクトリ（未設定時は `www/` がデフォルト）|
| `VITE_STRAPI_API_URL` | Strapi Cloud URL | — |
| `VITE_STRAPI_API_TOKEN` | Strapi API トークン | — |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | — |
| `VITE_SITE_URL` | `https://mizzz.jp` | 本番ドメイン |
| `VITE_FORMSPREE_CONTACT_ID` | Formspree ID | — |
| `VITE_FORMSPREE_REQUEST_ID` | Formspree ID | — |

> `FTP_SERVER_DIR` を設定しない場合、デフォルトの `www/` が使われます。  
> ロリポップで独自ドメインを別ディレクトリに設定している場合のみ変更してください。

### デプロイフロー

```
git push origin main
  └→ GitHub Actions が起動
       └→ npm run build:frontend
            └→ FTP で dist/ をアップロード
```

`main` ブランチへのプッシュで自動デプロイが実行されます。

---

## 5. SSL の確認

ロリポップの無料 SSL（Let's Encrypt）を有効化します。

1. ロリポップ管理画面 → セキュリティ → 独自 SSL
2. ドメインに対して SSL を有効化
3. `https://your-domain.com` でアクセス確認

> `VITE_SITE_URL` は必ず `https://` で設定してください。

---

## 6. 環境変数の確認（本番ビルド）

`frontend/.env.production` に以下が設定されていることを確認:

```env
VITE_SITE_URL=https://your-domain.com
VITE_STRAPI_API_URL=https://xxxx.api.strapi.io
VITE_STRAPI_API_TOKEN=your_token
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_key
VITE_FORMSPREE_CONTACT_ID=your_id
VITE_FORMSPREE_REQUEST_ID=your_id
```

---

## 7. 更新デプロイ

コードを更新した後:

```bash
git add .
git commit -m "update: ..."
git push origin main
```

GitHub Actions が自動で再ビルド・再アップロードします。

---

## 8. トラブルシューティング

### ページが 404 になる（直接アクセス時）

`dist/.htaccess` がサーバーに配置されていない可能性があります。

```bash
ls frontend/dist/.htaccess  # 存在確認
```

存在しない場合は `frontend/public/.htaccess` を作成してから再ビルドしてください。

### CSS / JS が 404

ビルド成果物のパスが間違っている可能性があります。  
`dist/` の**中身**がサイトルートに来るようにアップロードしてください。

`dist/index.html` にアクセスしているのではなく、  
`www/index.html` となっているか確認します。

### FTP 接続エラー

- パッシブモードで接続してみる
- ロリポップ管理画面で FTP 接続制限を確認
- IP アドレス制限がある場合は許可リストに追加

### Strapi API が取得できない

1. ロリポップからのリクエストが Strapi Cloud に届いているか確認
2. ブラウザの DevTools > Network で API リクエストを確認
3. CORS エラーであれば Strapi の `FRONTEND_URL` を確認
