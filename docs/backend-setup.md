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
4. ログイン後、Content Manager からコンテンツを管理できます

---

## コンテンツタイプ一覧

スキーマ JSON ファイルは `backend/src/api/` に配置済みです。  
Strapi 起動時に自動的に読み込まれます。

### フロントエンドと API エンドポイントの対応

| コンテンツタイプ | Strapi API ID | フロントエンドエンドポイント |
|---|---|---|
| 作品 | `api::work.work` | `/api/works` |
| ニュース | `api::news-item.news-item` | `/api/news-items` |
| ブログ | `api::blog-post.blog-post` | `/api/blog-posts` |
| イベント | `api::event.event` | `/api/events` |
| ファンクラブ | `api::fanclub-content.fanclub-content` | `/api/fanclub-contents` |
| ストア商品 | `api::store-product.store-product` | `/api/store-products` |
| メディア掲載 | `api::media-item.media-item` | `/api/media-items` |
| 受賞 | `api::award.award` | `/api/awards` |
| FAQ | `api::faq.faq` | `/api/faqs` |
| サイト設定 | `api::site-setting.site-setting` | `/api/site-setting` |
| プロフィール | `api::profile.profile` | `/api/profile` |

---

### 共通フィールド（ContentBase）

コンテンツ系タイプ（works / news / blog / events / fanclub）はすべて以下を持ちます:

| フィールド | 型 | 説明 |
|---|---|---|
| `title` | String | タイトル（必須） |
| `slug` | UID (from title) | URL スラッグ（必須・一意） |
| `status` | Enumeration | `public` / `fc_only` / `limited` |
| `publishAt` | DateTime | 公開日時 |
| `limitedEndAt` | DateTime | 限定公開終了日時 |
| `archiveVisibleForFC` | Boolean | 期限後 FC 閲覧可否 |

---

### 1. works（作品）`/api/works`

| フィールド | 型 |
|---|---|
| `description` | Text |
| `thumbnail` | Media（画像） |
| `category` | String |
| `isFeatured` | Boolean |
| `externalUrl` | String |

---

### 2. news-items（ニュース）`/api/news-items`

| フィールド | 型 |
|---|---|
| `body` | RichText |
| `thumbnail` | Media（画像） |

---

### 3. blog-posts（ブログ）`/api/blog-posts`

| フィールド | 型 |
|---|---|
| `body` | RichText |
| `thumbnail` | Media（画像） |
| `tags` | JSON |

---

### 4. events（イベント）`/api/events`

| フィールド | 型 |
|---|---|
| `description` | Text |
| `startAt` | DateTime（必須） |
| `endAt` | DateTime |
| `venue` | String |
| `venueUrl` | String |
| `bookingLink` | String |
| `bookingStatus` | Enumeration: `open` / `closed` / `soldout` / `free` |
| `thumbnail` | Media（画像） |

---

### 5. fanclub-contents（ファンクラブ）`/api/fanclub-contents`

| フィールド | 型 |
|---|---|
| `body` | RichText |
| `category` | Enumeration: `diary` / `exclusive` / `qa` / `behind_scenes` / `teaser` / `live_archive` / `tips` / `info` |
| `thumbnail` | Media（画像） |

---

### 6. store-products（ストア商品）`/api/store-products`

| フィールド | 型 |
|---|---|
| `price` | Integer |
| `currency` | String（デフォルト: `JPY`） |
| `description` | Text |
| `previewImage` | Media（画像） |
| `stripeLink` | String |
| `baseLink` | String |
| `purchaseStatus` | Enumeration: `available` / `soldout` / `coming_soon` |
| `externalPurchaseNote` | Text |

---

### 7. media-items（メディア掲載）`/api/media-items`

| フィールド | 型 |
|---|---|
| `title` | String（必須） |
| `source` | String |
| `url` | String |

---

### 8. awards（受賞）`/api/awards`

| フィールド | 型 |
|---|---|
| `title` | String（必須） |
| `year` | Integer |
| `organization` | String |

---

### 9. faqs（FAQ）`/api/faqs`

| フィールド | 型 |
|---|---|
| `question` | String（必須） |
| `answer` | Text（必須） |
| `category` | Enumeration: `general` / `fanclub` / `store` / `works` / `events` / `contact` |
| `order` | Integer |

---

### 10. site-setting（サイト設定）`/api/site-setting`（Single Type）

| フィールド | 型 |
|---|---|
| `siteName` | String（必須） |
| `description` | Text |
| `logoUrl` | String |
| `heroTitle` | String |
| `heroSubtitle` | Text |
| `heroCTALabel` | String |
| `heroCTAUrl` | String |
| `ogImage` | Media（画像） |
| `socialInstagram` | String |
| `socialX` | String |
| `socialYoutube` | String |

---

### 11. profile（プロフィール）`/api/profile`（Single Type）

| フィールド | 型 |
|---|---|
| `name` | String（必須） |
| `bio` | Text |
| `bioShort` | String |
| `avatar` | Media（画像） |
| `location` | String |
| `website` | String |

---

## Public Role の権限設定

コンテンツタイプ起動後、未認証ユーザーが読み取れるよう権限を設定します。

```
Settings > Roles > Public > 各コンテンツタイプ
```

**読み取り専用として許可する操作:**

| コンテンツタイプ | find | findOne |
|---|---|---|
| work | ✅ | ✅ |
| news-item | ✅ | ✅ |
| blog-post | ✅ | ✅ |
| event | ✅ | ✅ |
| fanclub-content | ✅ | ✅ |
| store-product | ✅ | ✅ |
| media-item | ✅ | ✅ |
| award | ✅ | ✅ |
| faq | ✅ | ✅ |
| site-setting | ✅ | — |
| profile | ✅ | — |

> **FC 限定コンテンツについて:** Strapi 側ではすべて公開し、  
> フロントエンドの `canViewContent()` + `status` フィールドでアクセス制御しています。  
> 管理系 API（create / update / delete）は Public Role では絶対に許可しないでください。

---

## API トークンの発行

```
Settings > API Tokens > Create new API Token
```

- **Token name:** `frontend-read` など識別しやすい名前
- **Token type:** `Read-only`
- **Duration:** Unlimited（本番）または 90 days（テスト）

発行したトークンを `frontend/.env.local` の `VITE_STRAPI_API_TOKEN` に設定します。

---

## テストデータの投入

コンテンツタイプ定義後、`backend/scripts/seed/` のフィクスチャデータを投入できます。

```bash
# Strapi を停止してから実行
npm run seed --prefix backend
# または
npm run seed:backend
```

フィクスチャファイルの場所:

```
backend/scripts/seed/fixtures/
├── works.json          # 14件（featured / public / fc_only / limited）
├── news.json           # 12件
├── blog.json           # 12件
├── events.json         # 8件
├── fanclub.json        # 12件
├── store-products.json # 12件
├── media.json          # 10件
└── faq.json            # 14件
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

### コンテンツタイプが API に表示されない

スキーマ JSON を追加した後は Strapi を再起動してください:

```bash
# Strapi 停止後
npm run develop --prefix backend
```
