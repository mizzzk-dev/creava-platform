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

## 自動デプロイ

`main` ブランチにプッシュすると Strapi Cloud が自動でビルド・デプロイします。

GitHub 連携の設定:
1. Strapi Cloud Dashboard → Settings → GitHub
2. 対象ブランチとルートディレクトリを確認

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

Public Role の権限設定が未完了です。  
`Settings > Roles > Public` で `find` / `findOne` を有効化してください。

### CORS エラー

Strapi Cloud Dashboard の Variables に `FRONTEND_URL=https://your-domain.com` が  
設定されているか確認してください。

---

## 将来 AWS に移行する場合

`backend/.env.production.example` には PostgreSQL の設定コメントがあります。  
AWS RDS + EC2/ECS での運用も同じ環境変数で対応可能です。  
移行時は `DATABASE_CLIENT=postgres` に切り替えてください。
