# Strapi Cloud デプロイ手順

`backend/` を Strapi Cloud にデプロイして本番 CMS を運用する手順です。

## Strapi Cloud とは

Strapi が公式に提供するマネージドホスティングサービスです。  
自前でサーバーを管理せずに Strapi を本番運用できます。

- 無料プランあり（制限あり）
- PostgreSQL DB が自動プロビジョニング
- 管理画面・API の両方がホストされる

---

## 1. Strapi Cloud アカウント準備

1. [cloud.strapi.io](https://cloud.strapi.io) でアカウント作成
2. GitHub リポジトリと連携

---

## 2. プロジェクト作成

1. Strapi Cloud ダッシュボードで「Create Project」
2. GitHub リポジトリ `mizzzk-dev/creava-platform` を選択
3. ブランチ: `main`
4. **Root Directory**: `backend` を指定（⚠️ 重要）
5. Node.js バージョン: 20.x を選択

---

## 3. 環境変数の設定

Strapi Cloud のプロジェクト設定 → **Variables** に以下を登録します。

シークレット生成コマンド（ローカルで実行）:

```bash
openssl rand -base64 32
```

| 変数名 | 説明 | 例 |
|---|---|---|
| `APP_KEYS` | Strapi アプリキー（4個カンマ区切り） | `key1,key2,key3,key4` |
| `API_TOKEN_SALT` | API トークン生成ソルト | ランダム32文字 |
| `ADMIN_JWT_SECRET` | 管理画面 JWT シークレット | ランダム32文字 |
| `TRANSFER_TOKEN_SALT` | データ転送トークンソルト | ランダム32文字 |
| `JWT_SECRET` | ユーザー JWT シークレット | ランダム32文字 |
| `ENCRYPTION_KEY` | 暗号化キー | ランダム32文字 |
| `FRONTEND_URL` | フロントエンドの本番 URL | `https://your-domain.com` |

> ⚠️ `backend/.env.production.example` をテンプレートとして使用してください。  
> ⚠️ 本番の値は絶対に Git にコミットしないでください。

---

## 4. デプロイ

環境変数を設定後、「Deploy」ボタンをクリックします。

デプロイが完了すると:

- API URL: `https://xxxx.api.strapi.io`
- 管理画面: `https://xxxx.api.strapi.io/admin`

---

## 5. 管理者アカウント作成

デプロイ後、管理画面で管理者アカウントを作成します。

1. `https://xxxx.api.strapi.io/admin` にアクセス
2. 管理者情報を入力してアカウント作成
3. ログイン

---

## 6. コンテンツタイプの定義

管理画面 → **Content-Type Builder** でコンテンツタイプを作成します。

必要なコンテンツタイプの詳細は [`backend-setup.md`](./backend-setup.md) を参照してください。

コンテンツタイプを作成するたびに Strapi Cloud が自動でデプロイを実行します。

---

## 7. Public Role の権限設定

`Settings > Roles > Public` で各コンテンツタイプの読み取り権限を設定します。

- 各コンテンツタイプの `find` と `findOne` を有効化
- Save

---

## 8. API トークンの発行

`Settings > API Tokens > Create new API Token`

- **Name**: `frontend-read-token`
- **Token type**: `Read-only`
- **Duration**: Unlimited

発行されたトークンをコピーして:
- ロリポップ側: `VITE_STRAPI_API_TOKEN` に設定
- GitHub Secrets: `VITE_STRAPI_API_TOKEN` に設定

---

## 9. CORS 設定の確認

デプロイ後、`backend/config/middlewares.ts` の `FRONTEND_URL` 環境変数が  
Strapi Cloud Dashboard に設定されているか確認します。

```typescript
// backend/config/middlewares.ts
origin: [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL ?? 'https://your-domain.com',
],
```

---

## 10. frontend との接続確認

1. `frontend/.env.production` に Strapi Cloud の URL とトークンを設定
2. `npm run build:prod` でビルド
3. ロリポップにデプロイ
4. `https://your-domain.com/works` などでデータが取得できるか確認

---

## 自動デプロイ（GitHub Actions）

`.github/workflows/deploy-backend.yml` により、`main` ブランチへの push 時に  
`backend/` 配下の変更が検出された場合に自動でデプロイが実行されます。

### 方式 A: Strapi Cloud（推奨）

#### 必要な GitHub Secrets

| Secret 名 | 取得場所 |
|---|---|
| `STRAPI_DEPLOY_TOKEN` | Strapi Cloud → Settings → Deploy Token |

#### 必要な GitHub Variables

| Variable 名 | 値 |
|---|---|
| `BACKEND_DEPLOY_TARGET` | `strapi_cloud` |

設定場所: GitHub リポジトリ → **Settings → Secrets and variables → Actions**

#### Strapi Cloud Deploy Token の取得手順

1. [cloud.strapi.io](https://cloud.strapi.io) にログイン
2. プロジェクト → **Settings → Deploy**
3. 「Generate Deploy Token」をクリック
4. 表示されたトークンを GitHub Secret `STRAPI_DEPLOY_TOKEN` に登録

---

### 方式 B: VPS / SSH

#### 必要な GitHub Secrets

| Secret 名 | 説明 |
|---|---|
| `VPS_HOST` | サーバーの IP またはドメイン |
| `VPS_USER` | SSH ユーザー名（例: `ubuntu`） |
| `VPS_SSH_KEY` | SSH 秘密鍵（`~/.ssh/id_rsa` の中身） |
| `VPS_PORT` | SSH ポート（省略時: 22） |
| `VPS_APP_DIR` | サーバー上のリポジトリパス（例: `/var/www/creava-platform`） |

#### 必要な GitHub Variables

| Variable 名 | 値 |
|---|---|
| `BACKEND_DEPLOY_TARGET` | `vps_ssh` |

#### サーバー事前準備

```bash
# Node.js 20.x インストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 インストール
npm install -g pm2

# リポジトリをクローン
git clone https://github.com/mizzz-dev/creava-platform.git /var/www/creava-platform
cd /var/www/creava-platform/backend

# 環境変数を設定
cp .env.local.example .env
# .env を編集（DATABASE_CLIENT=postgres など）

# 初回起動
npm ci && npm run build && npm run start &
pm2 start npm --name strapi -- run start
pm2 save
pm2 startup
```

---

### 手動デプロイ（workflow_dispatch）

GitHub Actions の画面から任意のタイミングでデプロイを実行できます:

1. GitHub → **Actions → Deploy Backend (Strapi)**
2. 「Run workflow」をクリック
3. デプロイ先（`strapi_cloud` / `vps_ssh`）を選択して実行

---

### Strapi Cloud の GitHub 連携（別途）

Strapi Cloud 側でも GitHub 連携すると、push 時に Strapi Cloud 自身がビルドを実行します。  
GitHub Actions と Strapi Cloud の両方をオンにすると二重デプロイになるため、  
**どちらか一方のみを使用**してください。

| 方式 | 推奨シーン |
|---|---|
| GitHub Actions（本ワークフロー） | CI と統合して管理したい場合 |
| Strapi Cloud 自動デプロイ | シンプルに運用したい場合 |

---

## データバックアップ

Strapi Cloud はデータの自動バックアップを提供しています（プランによる）。

手動バックアップ:

```bash
# Strapi CLI でデータエクスポート
cd backend
npx strapi export --no-encrypt -f backup-$(date +%Y%m%d)
```

---

## トラブルシューティング

### デプロイが失敗する

1. Strapi Cloud のビルドログを確認
2. `backend/package.json` の engines.node が `>=20` になっているか確認
3. TypeScript のビルドエラーがないか確認

### 管理画面にアクセスできない

1. 環境変数（`APP_KEYS`, `ADMIN_JWT_SECRET` など）が設定されているか確認
2. デプロイが完了しているか確認（ビルドログ参照）

### API が 403 を返す

次の順で確認してください。

1. `Settings > Roles > Public` で対象コンテンツタイプの `find` / `findOne` を有効化
2. 記事が `Published` 状態であることを確認（Draft は公開 API に出ません）
3. `news-item` は `backend/src/api/news-item/routes/news-items.ts` で `find` / `findOne` を `auth: false` にしているため、Cloud 側権限差分の影響を受けにくい構成です

> それでも 403 が続く場合は、Strapi Cloud の再デプロイ後に `/api/news-items` を直接叩いて挙動を確認してください。

### CORS エラー

Strapi Cloud Dashboard の Variables に `FRONTEND_URL=https://your-domain.com` が  
設定されているか確認してください。

---

## 将来 AWS に移行する場合

`backend/.env.production.example` には PostgreSQL の設定コメントがあります。  
AWS RDS + EC2/ECS での運用も同じ環境変数で対応可能です。  
移行時は `DATABASE_CLIENT=postgres` に切り替えてください。
