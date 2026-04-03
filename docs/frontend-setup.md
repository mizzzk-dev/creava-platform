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
| `VITE_FORMSPREE_CONTACT_ID` | Formspree フォーム ID | 送信シミュレーション |
| `VITE_FORMSPREE_REQUEST_ID` | Formspree フォーム ID | 送信シミュレーション |

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

## Formspree の設定（お問い合わせフォーム）

フォームの送信先は [Formspree](https://formspree.io) を使っています。送信内容はメールで届きます。

### アカウント・フォーム作成

1. [formspree.io](https://formspree.io) でアカウントを作成（無料プランで月 50 件）
2. ダッシュボード → **New Form** を 2 つ作成:
   - `creava-contact`（お問い合わせ用）
   - `creava-request`（仕事依頼用）
3. 各フォームの **Settings** → **Notifications** で受信メールアドレスを設定
4. 各フォームの **Integration** タブからフォーム ID（`xxxxxxxx` 形式）をコピー

### ローカル開発で設定

```bash
# frontend/.env.local に追記
VITE_FORMSPREE_CONTACT_ID=xxxxxxxx
VITE_FORMSPREE_REQUEST_ID=xxxxxxxx
```

未設定の場合は 800ms 遅延のスタブ動作（実際には送信されません）。  
開発サーバーのコンソールに警告が表示されます。

### 本番環境（GitHub Actions）

GitHub リポジトリ → Settings → Secrets and variables → Actions:

| Secret 名 | 値 |
|---|---|
| `VITE_FORMSPREE_CONTACT_ID` | お問い合わせフォームの ID |
| `VITE_FORMSPREE_REQUEST_ID` | 仕事依頼フォームの ID |

`main` へのプッシュで自動ビルド・デプロイされ、本番環境に反映されます。

### 動作確認

1. `npm run dev` で開発サーバーを起動
2. `/contact` を開く
3. フォームを送信 → Formspree ダッシュボードで受信確認
4. 設定したメールアドレスに通知が届くことを確認

---

## 関連ドキュメント

- [開発環境セットアップ](./development-setup.md)
- [ロリポップデプロイ](./deploy-lolipop.md)
- [本番デプロイ概要](./deploy-production.md)
