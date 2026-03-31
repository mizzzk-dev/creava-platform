# creava-platform

Strapi（Headless CMS）・Clerk 認証・Shopify 連携で構築するクリエイター向けポートフォリオ / ファンクラブ / ストアプラットフォーム

## 技術スタック

| レイヤー | 技術 |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| CMS | Strapi Cloud v5 |
| Auth | Clerk |
| Store | Shopify Storefront API |
| i18n | i18next（ja / en） |
| Routing | React Router v6 |
| Testing | Vitest |

## 開発環境のセットアップ

```bash
# 依存パッケージのインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.local を編集して各 API キーを設定

# 開発サーバー起動
npm run dev
```

## 主要コマンド

```bash
npm run dev           # 開発サーバー起動
npm run build:prod    # 本番ビルド（dist/ に出力）
npm run preview       # ビルド結果のプレビュー
npm test              # ユニットテスト実行
npm run test:coverage # カバレッジ付きテスト
```

## デプロイ

| ホスティング | ドキュメント |
|---|---|
| ロリポップレンタルサーバー | [docs/deploy-lolipop.md](docs/deploy-lolipop.md) |
| お名前.comレンタルサーバー | [docs/deploy-onamae.md](docs/deploy-onamae.md) |

## 運用

公開後の更新・トラブル対応については [docs/operation.md](docs/operation.md) を参照してください。

## 主要ページ

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

## 環境変数

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

テンプレート: `.env.example`（開発用）/ `.env.production.example`（本番用）

## アクセス制御

| ユーザー種別 | 閲覧できるコンテンツ |
|---|---|
| ゲスト（未ログイン） | `public` コンテンツ |
| メンバー（ログイン済み） | `public` + `fc_only` + 有効期限内の `limited` |
| 管理者 | すべて |

## CI / CD

| ワークフロー | トリガー | 内容 |
|---|---|---|
| `ci.yml` | PR・`main` push | 型チェック + テスト + ビルド確認 |
| `deploy.yml` | `main` push・手動 | ビルド + FTP デプロイ |
