# creava-platform

クリエイター向けポートフォリオ / ファンクラブ / ストアプラットフォーム

React + Vite フロントエンドと Strapi CMS バックエンドで構成されるモノレポです。

---

## ディレクトリ構成

```
creava-platform/
├── frontend/          # React + Vite + TypeScript フロントエンド
│   ├── src/
│   ├── public/
│   ├── docs/          # デプロイ・運用ドキュメント
│   ├── index.html
│   └── package.json
├── backend/           # Strapi CMS（初期化前の準備ディレクトリ）
│   └── README.md
├── .github/
│   └── workflows/     # CI / デプロイ自動化
├── .gitignore
├── package.json       # ルート: モノレポ管理スクリプト
└── README.md
```

---

## 各パッケージの役割

| ディレクトリ | 役割 |
|---|---|
| `frontend/` | React + Vite による SPA。Strapi・Clerk・Shopify に接続する |
| `backend/` | Strapi CMS。コンテンツ管理 API を提供する（初期化は次ステップ） |

---

## セットアップ

### frontend のみ使う場合（現在の主な開発フロー）

```bash
cd frontend
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.local を編集して各 API キーを設定

# 開発サーバー起動
npm run dev
```

### 全パッケージ一括インストール

```bash
# リポジトリルートで
npm run install:all
```

---

## 開発起動コマンド

| コマンド | 説明 |
|---|---|
| `npm run dev:frontend` | frontend 開発サーバー起動 |
| `npm run build:frontend` | frontend 本番ビルド |
| `npm run test:frontend` | frontend ユニットテスト |
| `npm run dev:backend` | backend（Strapi）開発サーバー起動 |
| `npm run build:backend` | backend ビルド |

または各ディレクトリで直接実行することもできます:

```bash
cd frontend && npm run dev
cd backend && npm run develop  # Strapi 初期化後
```

---

## 技術スタック

### frontend

| レイヤー | 技術 |
|---|---|
| UI | React 18 + TypeScript |
| ビルド | Vite |
| スタイル | Tailwind CSS + Framer Motion |
| ルーティング | React Router v6 |
| 認証 | Clerk |
| CMS | Strapi Cloud v5（API 経由） |
| ストア | Shopify Storefront API |
| i18n | i18next（ja / en） |
| テスト | Vitest |

### backend

| レイヤー | 技術 |
|---|---|
| CMS | Strapi v5（予定） |
| DB | SQLite（開発）/ PostgreSQL（本番） |
| デプロイ | Strapi Cloud |

---

## 環境変数

`frontend/.env.example`（開発用）および `frontend/.env.production.example`（本番用）を参照してください。

| 変数名 | 説明 |
|---|---|
| `VITE_SITE_URL` | サイトの URL |
| `VITE_STRAPI_API_URL` | Strapi Cloud API エンドポイント |
| `VITE_STRAPI_API_TOKEN` | Strapi API トークン |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Publishable Key |
| `VITE_SHOPIFY_STORE_DOMAIN` | Shopify ストアドメイン |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Shopify Storefront API トークン |
| `VITE_FORMSPREE_CONTACT_ID` | Formspree お問い合わせフォーム ID |
| `VITE_FORMSPREE_REQUEST_ID` | Formspree 仕事依頼フォーム ID |

---

## デプロイ

### frontend（ロリポップレンタルサーバー）

`main` ブランチへの push で自動デプロイされます。

手動ビルド手順: `frontend/docs/deploy-lolipop.md` を参照してください。

### backend（Strapi Cloud）

Strapi Cloud とリポジトリを連携し、`backend/` をルートディレクトリとして指定します。
詳細は `backend/README.md` を参照してください。

---

## ページ構成

| パス | ページ |
|---|---|
| `/` | ホーム |
| `/works` | 作品一覧 |
| `/works/:slug` | 作品詳細 |
| `/news` | ニュース一覧 |
| `/news/:slug` | ニュース詳細 |
| `/blog` | ブログ一覧 |
| `/blog/:slug` | ブログ詳細 |
| `/fanclub` | ファンクラブ（会員限定） |
| `/fanclub/:slug` | ファンクラブ詳細 |
| `/store` | ストア |
| `/store/:handle` | 商品詳細 |
| `/contact` | お問い合わせ / 仕事依頼 |

---

## CI / CD

| ワークフロー | トリガー | 内容 |
|---|---|---|
| `ci.yml` | PR・`main` push | 型チェック + テスト + ビルド確認 |
| `deploy.yml` | `main` push・手動 | ビルド + FTP デプロイ（ロリポップ） |

---

## 次のステップ

Strapi を `backend/` に初期化する場合は `backend/README.md` を参照してください。
