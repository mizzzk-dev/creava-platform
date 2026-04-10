# DB 環境構築の事前準備（Strapi 1インスタンス / DB 1つ運用）

このドキュメントは、**実装前の準備専用**です。  
対象は「Strapi 1つで main / store / fanclub を横断管理する」現行方針です。

---

## 0. 方針（今回の前提）

- DB は **1つのみ**（staging と production は別環境として持つが、各環境で DB は単一）。
- Strapi は **1インスタンスで3サイトのコンテンツを管理**する。
- フロントエンドは 3 デプロイ（main / store / fanclub）だが、接続先 CMS は共通。
- 公開制御は既存の `accessStatus`（`public` / `fc_only` / `limited`）で運用する。
- ドメイン別のテーブル整理は Strapi の content-type 命名（例: `store_products`, `fanclub_contents`）に任せる。

---

## 1. 先に決めること（実装前チェック）

### 1-1. 環境の切り分け

- `staging` 用 Strapi プロジェクト（または環境）
- `production` 用 Strapi プロジェクト（または環境）

> ポイント: 「DB は1つ」＝「全環境で1つ」ではなく、**環境ごとに単一 DB を持つ**のが安全です。

### 1-2. DB 提供方式

- Strapi Cloud マネージド PostgreSQL を使うか
- 外部 PostgreSQL（Neon / Supabase / RDS 等）を使うか

### 1-3. 接続方式

- `DATABASE_URL` で統一するか
- `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_NAME` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` を使うか

> このリポジトリの Strapi 設定は両対応です。運用では `DATABASE_URL` 優先を推奨。

---

## 2. GitHub Actions に必要な設定

このリポジトリは `deploy-backend.yml` で `environment: staging / production` を使うため、  
**GitHub Environments ごとに Secret を設定**します。

設定場所:  
`GitHub Repository > Settings > Environments > staging / production`

### 2-1. backend デプロイ用（必須）

- `STRAPI_DEPLOY_TOKEN`（Secret）
  - Strapi Cloud の Deploy Token。
  - `deploy-backend.yml` の `Deploy to Strapi Cloud` ステップで参照。

### 2-2. frontend ビルド接続先（実質必須）

フロント 3サイトのビルド時に共通 Strapi を参照するため、同じく Environment に設定します。

- `VITE_STRAPI_API_URL`（Secret）
  - 例: `https://<your-strapi-domain>`
- `VITE_STRAPI_API_TOKEN`（Secret）
  - Strapi の read-only API Token

> これらは `deploy.yml` の Build ステップで参照されます。

### 2-3. 推奨（運用安定化）

- Environment protection rules（必須レビュー / 承認者）
- Secret のローテーション周期（例: 90日）
- `production` だけ手動実行 (`workflow_dispatch`) に寄せる運用ルール

---

## 3. Strapi 側の環境変数（事前に値だけ準備）

`backend/config/database.ts` の定義に合わせ、以下を準備します。

### 3-1. DB 接続

- `DATABASE_CLIENT=postgres`
- `DATABASE_URL`（推奨）
- （必要なら）
  - `DATABASE_SSL=true`
  - `DATABASE_SSL_REJECT_UNAUTHORIZED=true/false`
  - `DATABASE_SCHEMA=public`

### 3-2. Strapi 基本シークレット

- `APP_KEYS`
- `API_TOKEN_SALT`
- `ADMIN_JWT_SECRET`
- `TRANSFER_TOKEN_SALT`
- `JWT_SECRET`
- `ENCRYPTION_KEY`

### 3-3. CORS / 公開系

- `FRONTEND_URL`
  - 本番例: `https://mizzz.jp,https://store.mizzz.jp,https://fc.mizzz.jp`
  - ステージング例: `https://stg.mizzz.jp,https://store-stg.mizzz.jp,https://fc-stg.mizzz.jp`

---

## 4. GitHub Action へ環境変数を入れる実務手順

1. `staging` Environment を作成
2. `production` Environment を作成
3. 各 Environment に以下 Secret を登録
   - `STRAPI_DEPLOY_TOKEN`
   - `VITE_STRAPI_API_URL`
   - `VITE_STRAPI_API_TOKEN`
4. `deploy-backend.yml` を `workflow_dispatch` で `target_env=staging` 実行
5. `deploy.yml` を `workflow_dispatch` で `target_env=staging` 実行
6. main/store/fc の表示確認（同一 Strapi データが出るか）
7. 問題なければ production へ同手順で展開

---

## 5. 事故防止チェックリスト（実装前に合意）

- [ ] DB は「環境ごとに単一」で合意した
- [ ] Strapi は 3 サイト共通バックエンドで合意した
- [ ] `accessStatus` で公開制御する運用で合意した
- [ ] staging / production それぞれに Environment Secret を投入した
- [ ] API Token は read-only を分離発行した
- [ ] ロールバック方法（トークン差し戻し / 直前バックアップ復元）を決めた

---

## 6. 今回やらないこと（明示）

- DB 作成・マイグレーション実行
- Strapi Cloud / PostgreSQL への実接続
- GitHub Secrets の実投入
- ワークフロー定義の変更

このドキュメントは、上記実装に入る前の準備台本として利用します。
