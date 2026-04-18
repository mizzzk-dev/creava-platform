# creava-platform

クリエイター向けポートフォリオ / ファンクラブ / ストアプラットフォーム

React + Vite フロントエンドと Strapi v5 CMS バックエンドで構成されるモノレポです。

---

## ディレクトリ構成

```
creava-platform/
├── frontend/                   # React + Vite + TypeScript SPA
│   ├── src/
│   │   ├── components/         # 共通UIコンポーネント (Header, Footer, Cards)
│   │   ├── modules/            # 機能別モジュール (home, store, fanclub, ...)
│   │   ├── pages/              # ルートページコンポーネント
│   │   ├── hooks/              # 共通カスタムフック
│   │   ├── lib/                # API クライアント・モックデータ
│   │   └── locales/            # i18n 翻訳ファイル (ja / en)
│   ├── public/
│   ├── .env.local.example      # ローカル開発用 ENV テンプレート
│   └── package.json
├── backend/                    # Strapi v5 CMS
│   ├── config/                 # CORS・DB・サーバー設定
│   ├── scripts/
│   │   └── seed/               # テストデータ投入スクリプト
│   │       ├── fixtures/       # フィクスチャ JSON (8カテゴリ)
│   │       └── index.ts
│   ├── .env.local.example      # ローカル開発用 ENV テンプレート
│   ├── .env.production.example # 本番用 ENV テンプレート
│   └── package.json
├── docs/                       # 開発・デプロイドキュメント
│   ├── development-setup.md    # ローカル環境構築ガイド
│   ├── frontend-setup.md       # フロントエンド詳細設定
│   ├── backend-setup.md        # Strapi コンテンツタイプ定義手順
│   ├── deploy-production.md    # 本番デプロイチェックリスト
│   ├── deploy-lolipop.md       # ロリポップへの FTP デプロイ
│   └── deploy-backend-strapi-cloud.md
├── .github/workflows/          # CI / デプロイ自動化
├── package.json                # モノレポ管理スクリプト
└── README.md
```

---

## クイックスタート

```bash
# 1. 依存関係を一括インストール
npm run setup:dev

# 2. 環境変数を設定
cp frontend/.env.local.example frontend/.env.local
# frontend/.env.local を編集（最低限: VITE_STRAPI_API_URL は空でもモック動作可）

cp backend/.env.local.example backend/.env.local
# backend/.env.local を編集（APP_KEYS など必須シークレットを設定）

# 3. 開発サーバーを起動（別ターミナルで）
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://localhost:1337/admin
```

> **モック動作:** `VITE_STRAPI_API_URL` を設定しない場合、ストアなどは組み込みモックデータで動作します。Strapi なしでも UI の開発・確認が可能です。

詳細は [`docs/development-setup.md`](docs/development-setup.md) を参照してください。

---

## テストデータの投入

```bash
# Strapi コンテンツタイプを定義済みの場合
npm run seed:backend
```

フィクスチャデータ（`backend/scripts/seed/fixtures/`）の内容:

| カテゴリ | 件数 | 内容 |
|---|---|---|
| Works | 14 | public / fc_only / limited / featured |
| News | 12 | 公開・FC限定・期間限定 |
| Blog | 12 | タグ付き・FC限定 |
| Events | 8 | 開催前・終了済・FC限定 |
| Fanclub | 12 | FC専用・ティーザー・期間限定 |
| Store Products | 12 | 価格帯・支払い方法多様・sold out / coming soon |
| Media / Awards | 10 | 受賞・掲載・フェスティバル |
| FAQ | 14 | カテゴリ別（FC・ストア・連絡など） |

---

## 開発コマンド一覧

| コマンド | 説明 |
|---|---|
| `npm run dev:frontend` | フロントエンド開発サーバー起動 (port 5173) |
| `npm run dev:backend` | Strapi 開発サーバー起動 (port 1337) |
| `npm run build:frontend` | フロントエンド本番ビルド |
| `npm run build:backend` | Strapi ビルド |
| `npm run test:frontend` | Vitest ユニットテスト |
| `npm run test:frontend:watch` | テスト watch モード |
| `npm run test:frontend:coverage` | カバレッジレポート |
| `npm run seed:backend` | テストデータ投入 |
| `npm run install:all` | 全パッケージ依存関係インストール |
| `npm run setup:dev` | install:all の実行 + 次ステップ案内 |

---

## 技術スタック

### フロントエンド

| レイヤー | 技術 |
|---|---|
| UI | React 18 + TypeScript |
| ビルド | Vite |
| スタイル | Tailwind CSS + Framer Motion |
| フォント | JetBrains Mono (developer aesthetic) |
| ルーティング | React Router v6 |
| 認証 | Logto（キーなしは条件付きレンダリング） |
| CMS | Strapi v5（API 経由 / モックフォールバック対応） |
| 決済 | Stripe Payment Links + BASE |
| i18n | i18next（ja / en） |
| テスト | Vitest + React Testing Library |

### バックエンド

| レイヤー | 技術 |
|---|---|
| CMS | Strapi v5 |
| DB | SQLite（開発）/ PostgreSQL（本番） |
| 認証 | Strapi Users & Permissions + API Token |
| デプロイ | Strapi Cloud |

---

## ページ構成

| パス | ページ | アクセス |
|---|---|---|
| `/` | ホーム | 全員 |
| `/works` | 作品一覧 | 全員 |
| `/works/:slug` | 作品詳細 | 全員（FC限定あり） |
| `/news` | ニュース一覧 | 全員 |
| `/news/:slug` | ニュース詳細 | 全員（FC限定あり） |
| `/blog` | ブログ一覧 | 全員 |
| `/blog/:slug` | ブログ詳細 | 全員（FC限定あり） |
| `/fanclub` | ファンクラブ | FC会員 |
| `/fanclub/:slug` | ファンクラブ詳細 | FC会員 |
| `/store` | ストア | 全員 |
| `/store/:slug` | 商品詳細 | 全員（FC限定あり） |
| `/events` | イベント一覧 | 全員 |
| `/contact` | お問い合わせ / 仕事依頼 | 全員 |

---

## コンテンツアクセス制御

コンテンツは `status` フィールドで制御されます:

| status | 説明 |
|---|---|
| `public` | 全員に公開 |
| `fc_only` | FC会員のみ閲覧可 |
| `limited` | `publishAt` ～ `limitedEndAt` の期間のみ公開。`archiveVisibleForFC: true` の場合は期間後も FC 会員が閲覧可 |

---

## デプロイ

| 対象 | プラットフォーム | ドキュメント |
|---|---|---|
| フロントエンド | ロリポップレンタルサーバー | [`docs/deploy-lolipop.md`](docs/deploy-lolipop.md) |
| バックエンド | Strapi Cloud | [`docs/deploy-backend-strapi-cloud.md`](docs/deploy-backend-strapi-cloud.md) |
| 本番チェックリスト | — | [`docs/deploy-production.md`](docs/deploy-production.md) |

`main` ブランチへの push で GitHub Actions が自動ビルド・デプロイを実行します。

---

## CI / CD

| ワークフロー | トリガー | 内容 |
|---|---|---|
| `ci.yml` | PR・`main` push | 型チェック + テスト + ビルド確認 |
| `deploy.yml` | `main` push・手動 | ビルド + FTP デプロイ（ロリポップ） |

---

## 環境変数

`frontend/.env.local.example` および `backend/.env.local.example` を参照してください。

主要な変数:

| 変数名 | 場所 | 説明 |
|---|---|---|
| `VITE_STRAPI_API_URL` | frontend | Strapi API エンドポイント（未設定でモック動作） |
| `VITE_STRAPI_API_TOKEN` | frontend | Strapi API トークン |
| `VITE_LOGTO_ENDPOINT` | frontend | Logto OIDC エンドポイント（例: `https://auth.mizzz.jp`） |
| `VITE_LOGTO_APP_ID` | frontend | Logto SPA App ID（未設定で認証無効） |
| `VITE_LOGTO_API_RESOURCE` | frontend | API audience（アクセストークン取得時に使用） |
| `VITE_SITE_URL` | frontend | 本番サイト URL |
| `VITE_GA_MEASUREMENT_ID` | frontend | Google Analytics 4 測定ID（`G-` 形式、任意） |
| `VITE_ANALYTICS_OPS_ENDPOINT` | frontend | 主要イベントを Strapi に保存する endpoint（任意） |
| `APP_KEYS` | backend | Strapi セッションキー（必須） |
| `JWT_SECRET` | backend | Strapi JWT シークレット（必須） |
| `LOGTO_ISSUER` | backend | Logto JWT issuer（署名検証で使用） |
| `LOGTO_JWKS_URI` | backend | Logto JWKS URI（署名検証で使用） |
| `LOGTO_API_RESOURCE` | backend | API audience（JWT `aud` 検証） |
| `FRONTEND_URL` | backend | CORS 許可オリジン（本番） |
| `DATABASE_URL` | backend | PostgreSQL URL（本番のみ） |
| `ANALYTICS_OPS_TOKEN` | backend | 分析集計 API 保護トークン（推奨） |
