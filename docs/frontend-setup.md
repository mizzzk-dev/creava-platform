# Frontend セットアップガイド

`frontend/` ディレクトリの詳細セットアップ・起動・ビルド手順です。

## 技術スタック

| 技術 | 用途 |
|---|---|
| React 18 + TypeScript | UI フレームワーク |
| Vite | ビルドツール / 開発サーバー |
| Tailwind CSS | スタイリング |
| Framer Motion | アニメーション |
| React Router v6 | ルーティング |
| i18next | 国際化（ja / en） |
| Clerk | 認証 |
| Strapi REST API | CMS データ取得 |
| Formspree | お問い合わせフォーム |

---

## セットアップ

```bash
cd frontend
npm install
```

または root から:

```bash
npm install --prefix frontend
```

---

## 環境変数

### ファイルの優先順位（Vite のルール）

```
.env.local         ← 個人設定（Git 管理外、最優先）
.env               ← 共通設定（Git 管理）
.env.production    ← 本番ビルド時のみ（vite build 時）
```

### テンプレートからコピー

```bash
# ローカル開発用
cp frontend/.env.local.example frontend/.env.local

# 本番（GitHub Actions などでは Secrets から注入）
cp frontend/.env.production.example frontend/.env.production
```

### 変数一覧

| 変数名 | 説明 | 未設定時の挙動 |
|---|---|---|
| `VITE_SITE_URL` | サイト URL（SEO 用） | `http://localhost:5173` |
| `VITE_STRAPI_API_URL` | Strapi API エンドポイント | Store のみモックで動作、他は空表示 |
| `VITE_STRAPI_API_TOKEN` | Strapi API トークン | パブリックアクセスなら不要 |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk 認証キー | 認証無効化・guest 固定 |
| `VITE_SHOPIFY_STORE_DOMAIN` | Shopify ドメイン（将来用） | 現在は不使用 |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Shopify トークン（将来用） | 現在は不使用 |
| `VITE_SITE_TYPE` | サイト種別（`main` / `store` / `fc`） | `unknown` として保存 |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 の測定ID（`G-` 形式） | 計測無効（未送信） |

---

## 起動

### 開発サーバー

```bash
npm run dev
# または root から: npm run dev:frontend
```

`http://localhost:5173` で起動します。

### 本番プレビュー（ビルド結果を確認）

```bash
npm run build       # TypeScript チェック + Vite ビルド
npm run preview     # dist/ をローカルサーバーで確認
```

### テスト

```bash
npm run test              # 一回実行
npm run test:watch        # ウォッチモード
npm run test:coverage     # カバレッジ付き
```

---

## ビルド

### 本番ビルド

```bash
npm run build:prod
# または root から: npm run build:frontend
```

`frontend/dist/` に静的ファイルが生成されます。

> **注意:** ビルド前に `.env.production` が設定されていることを確認してください。  
> `VITE_` プレフィックスの変数はビルド時にバンドルされます。

### SPA ルーティング対応（ロリポップ）

ロリポップはサーバーサイドルーティングがないため、`dist/.htaccess` が必要です。

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

`public/.htaccess` に配置すると `dist/` にコピーされます。  
詳細は [`deploy-lolipop.md`](./deploy-lolipop.md) を参照してください。

---

## ディレクトリ構成

```
frontend/src/
├── components/         # 共通コンポーネント
│   ├── cards/          # ContentCard, WorkCard
│   ├── common/         # ErrorState, NotFoundState, Skeleton 類
│   ├── guards/         # ContentAccessGuard, FanclubGuard
│   ├── layout/         # Header, Footer
│   └── seo/            # PageHead
├── hooks/              # useAsyncState, useContentAccess, useCurrentUser ...
├── lib/
│   ├── api/            # Strapi クライアント（client.ts, strapi.ts, query.ts）
│   ├── mock/           # モックデータ（Strapi 未設定時のフォールバック）
│   └── shopify/        # Shopify クライアント（将来用）
├── locales/            # i18n 翻訳ファイル（ja / en）
├── modules/            # 機能ごとのモジュール
│   ├── blog/
│   ├── contact/
│   ├── fanclub/
│   ├── home/
│   ├── news/
│   ├── store/
│   └── works/
├── pages/              # ページコンポーネント
├── types/              # TypeScript 型定義
└── utils/              # ユーティリティ関数
```

---

## Clerk 認証の設定

### 開発環境（Clerk なし）

`VITE_CLERK_PUBLISHABLE_KEY` を空または未設定にすると、Clerk は完全に無効化されます。

- `useCurrentUser()` は常に `{ user: null, isSignedIn: false }` を返す
- FC 限定コンテンツは guest 扱い（表示されない）
- `AuthButton` は非表示

### 開発環境（Clerk あり）

1. [Clerk Dashboard](https://dashboard.clerk.com) でアプリを作成
2. `pk_test_...` キーを取得
3. `.env.local` の `VITE_CLERK_PUBLISHABLE_KEY` に設定
4. Clerk Dashboard でテストユーザーを作成してログイン確認

### 本番環境

- `pk_live_...` キーを `.env.production` に設定
- Clerk Dashboard でドメインを登録（Allowed Origins に追加）


### ソーシャルログイン拡張（Phase 4）

Clerk Dashboard の **Social Connections** で以下を有効化してください。

- Google
- Apple
- X
- Facebook

さらに `.env.local` / `.env.production` の各フラグを、Dashboard 側で有効化したプロバイダーと一致させます。

```bash
VITE_CLERK_SOCIAL_GOOGLE_ENABLED=true
VITE_CLERK_SOCIAL_APPLE_ENABLED=true
VITE_CLERK_SOCIAL_X_ENABLED=true
VITE_CLERK_SOCIAL_FACEBOOK_ENABLED=true
```

> 注意: これらは UI 上の「設定状態表示」を合わせるためのフラグです。実際のログイン可否は Clerk Dashboard 側の設定（審査・Client ID/Secret・コールバック URL）に依存します。

---

## i18n（国際化）

翻訳ファイルは `src/locales/` にあります。

```
src/locales/
├── ja/common.json   # 日本語（デフォルト）
└── en/common.json   # 英語
```

ブラウザの言語設定に応じて自動切替します。  
翻訳キーを追加した場合は両ファイルを更新してください。

---

## 問い合わせフォーム設定（Strapi 自前基盤）

フォーム送信先は `POST /api/inquiry-submissions/public` です。Formspree は利用しません。

### ローカル開発で設定

```bash
# frontend/.env.local
VITE_STRAPI_API_URL=http://localhost:1337
VITE_SITE_TYPE=main
```

### 本番環境（GitHub Actions）

| Secret 名 | 値 |
|---|---|
| `VITE_STRAPI_API_URL` | Strapi API URL |
| `VITE_STRAPI_API_TOKEN` | 公開コンテンツ取得トークン（必要時） |

### 動作確認

1. `npm run dev:backend` / `npm run dev:frontend` を起動
2. `/contact` の contact/request を送信
3. Strapi Admin の `Inquiry Submission` に保存されることを確認
4. `INQUIRY_NOTIFY_TO` 設定時は通知メール受信を確認

---

## 関連ドキュメント

- [開発環境セットアップ](./development-setup.md)
- [ロリポップデプロイ](./deploy-lolipop.md)
- [本番デプロイ概要](./deploy-production.md)
