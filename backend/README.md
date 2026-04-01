# backend

Strapi CMS を配置するディレクトリです。

## 役割

- コンテンツ管理 API（Blog / News / Works / Fanclub / Events / Media）
- Strapi Cloud へデプロイする想定
- `frontend/` からは `VITE_STRAPI_API_URL` 経由で API を呼び出す

## Strapi の初期化手順（次ステップ）

```bash
# backend/ ディレクトリで実行
cd backend
npx create-strapi-app@latest . --quickstart
```

または TypeScript テンプレートで初期化する場合:

```bash
npx create-strapi-app@latest . --ts
```

### 推奨設定

| 項目 | 値 |
|---|---|
| インストールタイプ | Quickstart（SQLite）または Custom（PostgreSQL） |
| TypeScript | 有効推奨 |
| デプロイ先 | Strapi Cloud |

## 開発時の起動

```bash
# リポジトリルートから
npm run dev:backend

# または backend/ 直下から
npm run develop
```

## Strapi Cloud へのデプロイ

1. [Strapi Cloud](https://cloud.strapi.io) でプロジェクトを作成
2. GitHub リポジトリと連携し、`backend/` をルートディレクトリとして指定
3. デプロイ後に API トークンを発行し `frontend/.env.production` の `VITE_STRAPI_API_URL` / `VITE_STRAPI_API_TOKEN` に設定

## 現在の状態

Strapi 初期化前の準備ディレクトリです。
初期化は次ステップで実施予定です。
