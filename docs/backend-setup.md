# Backend (Strapi) セットアップガイド

`backend/` ディレクトリの詳細セットアップ・コンテンツタイプ定義・API トークン発行手順です。

## 技術スタック

| 技術 | 用途 |
|---|---|
| Strapi v5 | ヘッドレス CMS |
| SQLite | ローカル開発用 DB |
| PostgreSQL | 本番環境推奨 DB |
| better-sqlite3 | SQLite ドライバ |

---

## セットアップ

```bash
cd backend
npm install
```

または root から:

```bash
npm install --prefix backend
```

---

## 環境変数

```bash
cp backend/.env.local.example backend/.env
```

最低限必要な設定:

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS="key1,key2,key3,key4"
API_TOKEN_SALT=random32chars
ADMIN_JWT_SECRET=random32chars
TRANSFER_TOKEN_SALT=random32chars
JWT_SECRET=random32chars
ENCRYPTION_KEY=random32chars
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

シークレット生成コマンド:

```bash
openssl rand -base64 32
```

---

## 起動

```bash
# 開発モード（ファイル変更で自動再起動）
npm run develop
# または root から: npm run dev:backend

# 本番モード
npm run start
```

起動後、`http://localhost:1337/admin` で管理画面にアクセスできます。

---

## 初回セットアップ（管理者アカウント作成）

1. `npm run develop` で起動
2. `http://localhost:1337/admin` を開く
3. 管理者アカウント（名前 / メール / パスワード）を入力して作成
4. ログイン後、Content Type Builder でコンテンツタイプを定義する

---

## コンテンツタイプの定義

> ⚠️ **重要:** Strapi のコンテンツタイプは管理画面の Content Type Builder か  
> `backend/src/api/` に JSON スキーマファイルを配置することで定義します。  
> 現在は空のため、以下のコンテンツタイプを手動で作成してください。

### 必要なコンテンツタイプ一覧

各コンテンツタイプに共通で含める基本フィールド（**ContentBase**）:

| フィールド | 型 | 説明 |
|---|---|---|
| `title` | String | タイトル（必須） |
| `slug` | UID (from title) | URL スラッグ（必須・一意） |
| `status` | Enumeration | `public` / `fc_only` / `limited` |
| `publishAt` | DateTime | 公開日時 |
| `limitedEndAt` | DateTime | 限定公開終了日時 |
| `archiveVisibleForFC` | Boolean | 期限後 FC 閲覧可否 |

---

### 1. works（作品）

API ID: `work` → エンドポイント: `/api/works`

追加フィールド:

| フィールド | 型 |
|---|---|
| `description` | Text |
| `thumbnailUrl` | String |
| `category` | String |
| `isFeatured` | Boolean |

---

### 2. news-items（ニュース）

API ID: `news-item` → エンドポイント: `/api/news-items`

追加フィールド:

| フィールド | 型 |
|---|---|
| `body` | RichText |
| `thumbnailUrl` | String |

---

### 3. blog-posts（ブログ）

API ID: `blog-post` → エンドポイント: `/api/blog-posts`

追加フィールド:

| フィールド | 型 |
|---|---|
| `body` | RichText |
| `thumbnailUrl` | String |
| `tags` | JSON |

---

### 4. events（イベント）

API ID: `event` → エンドポイント: `/api/events`

追加フィールド:

| フィールド | 型 |
|---|---|
| `description` | Text |
| `startAt` | DateTime |
| `endAt` | DateTime |
| `venue` | String |

---

### 5. fanclub-contents（ファンクラブ）

API ID: `fanclub-content` → エンドポイント: `/api/fanclub-contents`

追加フィールド:

| フィールド | 型 |
|---|---|
| `body` | RichText |
| `thumbnailUrl` | String |

---

### 6. store-products（ストア商品）

API ID: `store-product` → エンドポイント: `/api/store-products`

追加フィールド:

| フィールド | 型 |
|---|---|
| `price` | Integer |
| `currency` | String（デフォルト: `JPY`） |
| `description` | Text |
| `previewImage` | Media |
| `stripeLink` | String |
| `baseLink` | String |
| `purchaseStatus` | Enumeration: `available` / `soldout` / `coming_soon` |
| `externalPurchaseNote` | Text |

---

### 7. media-items（メディア）

API ID: `media-item` → エンドポイント: `/api/media-items`

| フィールド | 型 |
|---|---|
| `title` | String |
| `source` | String |
| `url` | String |
| `publishedAt` | DateTime |

---

### 8. awards（受賞）

API ID: `award` → エンドポイント: `/api/awards`

| フィールド | 型 |
|---|---|
| `title` | String |
| `year` | Integer |
| `organization` | String |

---

## Public Role の権限設定

コンテンツタイプを作成したら、未認証ユーザーが読み取れるよう権限を設定します。

1. `Settings > Roles > Public` を開く
2. 各コンテンツタイプに対して `find` と `findOne` を有効化
3. Save

**FC 限定コンテンツについて:** Strapi 側ではすべて公開し、  
フロントエンドの `canViewContent()` + `status` フィールドでアクセス制御しています。

---

## API トークンの発行

```
Settings > API Tokens > Create new API Token
```

- **Token type:** `Read-only`
- **Duration:** Unlimited（本番）または 90 days（テスト）

発行したトークンを `frontend/.env.local` の `VITE_STRAPI_API_TOKEN` に設定します。

---

## テストデータの投入

コンテンツタイプ定義後、`backend/scripts/seed/` のフィクスチャデータを投入できます。

```bash
# seed スクリプト実行（コンテンツタイプ定義後）
npm run seed --prefix backend
```

フィクスチャファイルの場所:

```
backend/scripts/seed/fixtures/
├── works.json          # 14件（featured / public / fc_only / limited）
├── news.json           # 12件
├── blog.json           # 12件
├── events.json         # 8件
├── fanclub.json        # 8件
├── store-products.json # 10件
├── media.json          # 8件
└── faq.json            # 12件
```

詳細は [`backend/scripts/seed/README.md`](../backend/scripts/seed/README.md) を参照してください。

---

## CORS 設定の確認

`backend/config/middlewares.ts` に許可オリジンが設定されています。

```typescript
origin: [
  'http://localhost:5173',   // Vite 開発サーバー
  'http://localhost:4173',   // Vite preview
  process.env.FRONTEND_URL ?? 'https://your-domain.com',  // 本番
],
```

本番ドメインを追加する場合は `FRONTEND_URL` 環境変数を設定してください。

---

## 本番デプロイ

詳細は [`deploy-backend-strapi-cloud.md`](./deploy-backend-strapi-cloud.md) を参照してください。

---

## よくあるエラー

### `strapi develop` が起動しない

```bash
# node_modules を再インストール
rm -rf backend/node_modules
npm install --prefix backend
```

### `Missing required key` エラー

`.env` の `APP_KEYS` や `ADMIN_JWT_SECRET` が設定されていない。  
`backend/.env.local.example` を参考に値を設定してください。

### SQLite ロックエラー

開発中に Strapi を二重起動するとロックが発生します。  
`lsof -i :1337` で既存プロセスを確認して kill してください。
