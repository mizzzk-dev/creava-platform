# backend（Strapi CMS）

creava-platform のコンテンツ管理 API です。Strapi v5 + TypeScript で構成されています。

## 役割

- コンテンツ管理 API（Blog / News / Works / Fanclub / Events / Media）
- `frontend/` からは `VITE_STRAPI_API_URL` 経由で API を呼び出す
- Strapi Cloud へデプロイする想定

## セットアップ

```bash
cd backend

# 依存パッケージのインストール
npm install

# 環境変数の設定
cp .env.example .env   # .env は .gitignore に含まれています
# .env を編集して各値を設定
```

## 開発起動

```bash
# backend/ ディレクトリで実行
npm run develop

# または リポジトリルートから
npm run dev:backend
```

起動後、管理画面は http://localhost:1337/admin でアクセスできます。

## 主要コマンド

| コマンド | 説明 |
|---|---|
| `npm run develop` | 開発サーバー（ファイル変更で自動再起動） |
| `npm run start` | 本番サーバー（自動再起動なし） |
| `npm run build` | 管理画面をビルド |
| `npm run strapi` | Strapi CLI を表示 |

## 環境変数

`.env` ファイルに以下を設定してください（`.gitignore` 済み）。

| 変数名 | 説明 |
|---|---|
| `HOST` | サーバーホスト（デフォルト: `0.0.0.0`） |
| `PORT` | サーバーポート（デフォルト: `1337`） |
| `APP_KEYS` | セッションキー（初期化時に自動生成） |
| `API_TOKEN_SALT` | API トークンのソルト |
| `ADMIN_JWT_SECRET` | 管理画面 JWT シークレット |
| `TRANSFER_TOKEN_SALT` | データ転送トークンのソルト |
| `DATABASE_CLIENT` | DB クライアント（デフォルト: `sqlite`） |
| `DATABASE_FILENAME` | SQLite ファイルパス（デフォルト: `.tmp/data.db`） |

## Strapi Cloud へのデプロイ

1. [Strapi Cloud](https://cloud.strapi.io) でプロジェクトを作成
2. GitHub リポジトリと連携し、**Root directory を `backend/`** に設定
3. デプロイ後に API トークンを発行
4. `frontend/.env.production` の `VITE_STRAPI_API_URL` / `VITE_STRAPI_API_TOKEN` を更新

## フロントエンドとの接続

`frontend/` の環境変数:

```env
VITE_STRAPI_API_URL=http://localhost:1337  # 開発時
VITE_STRAPI_API_URL=https://your-project.strapiapp.com  # 本番
VITE_STRAPI_API_TOKEN=your_api_token_here
```

CORS 設定は `config/middlewares.ts` の `strapi::cors` で管理しています。
