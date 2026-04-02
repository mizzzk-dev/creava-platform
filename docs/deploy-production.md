# 本番デプロイ概要

creava-platform の本番公開に必要な手順の全体像です。

## デプロイ構成

```
┌─────────────────────────────────────────┐
│  ユーザー                                │
└──────────────┬──────────────────────────┘
               │
       ┌───────▼────────┐
       │  ロリポップ      │  ← 静的ファイルホスティング
       │  (frontend)     │    Vite build → dist/ をアップロード
       └───────┬────────┘
               │ API リクエスト
       ┌───────▼────────┐
       │  Strapi Cloud   │  ← CMS / REST API
       │  (backend)      │    コンテンツ管理・配信
       └────────────────┘
```

### 各サービスの役割

| サービス | 役割 | 管理 |
|---|---|---|
| ロリポップ | 静的ファイルホスティング | FTP / GitHub Actions |
| Strapi Cloud | CMS・REST API | Strapi Cloud Dashboard |
| Clerk | 認証（JWT） | Clerk Dashboard |
| Formspree | お問い合わせフォーム | Formspree Dashboard |

---

## 本番公開チェックリスト

### 1. frontend ビルド前

- [ ] `frontend/.env.production` に本番用の値が設定されている
- [ ] `VITE_STRAPI_API_URL` → Strapi Cloud の API URL
- [ ] `VITE_STRAPI_API_TOKEN` → Strapi Cloud の Read-only トークン
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` → `pk_live_...` キー
- [ ] `VITE_SITE_URL` → 本番ドメイン（`https://your-domain.com`）
- [ ] `VITE_FORMSPREE_CONTACT_ID` / `VITE_FORMSPREE_REQUEST_ID` → 設定済み

### 2. ビルド

```bash
cd frontend
npm run build:prod
```

`dist/` ディレクトリに生成された静的ファイルを確認します。

- [ ] `dist/index.html` が存在する
- [ ] `dist/.htaccess` が存在する（SPA ルーティング用）
- [ ] `dist/assets/` に CSS / JS がある

### 3. ロリポップへのアップロード

詳細は [`deploy-lolipop.md`](./deploy-lolipop.md) を参照。

- [ ] FTP または GitHub Actions で `dist/` をアップロード
- [ ] `.htaccess` がサーバー上に配置されている
- [ ] `https://your-domain.com` で表示確認

### 4. Strapi Cloud の設定

詳細は [`deploy-backend-strapi-cloud.md`](./deploy-backend-strapi-cloud.md) を参照。

- [ ] Strapi Cloud にデプロイ済み
- [ ] 本番環境変数が Strapi Cloud Dashboard に設定済み
- [ ] `FRONTEND_URL=https://your-domain.com` が設定済み（CORS）
- [ ] コンテンツタイプが定義済み
- [ ] Public Role の `find` / `findOne` 権限が設定済み
- [ ] API トークンが発行済み

### 5. Clerk の設定

- [ ] Clerk Dashboard でドメインを登録
- [ ] Production インスタンスに切替（`pk_live_...` キー使用）
- [ ] Allowed Origins に本番ドメインを追加

### 6. 公開後確認

- [ ] トップページが表示される
- [ ] Works / News / Blog が Strapi からデータ取得できている
- [ ] ストアページが表示される
- [ ] お問い合わせフォームが送信できる
- [ ] Clerk ログイン・ログアウトが動作する
- [ ] FC 限定コンテンツの表示制御が正常

---

## 更新デプロイ手順

### コード更新（frontend）

```bash
git pull origin main
cd frontend
npm run build:prod
# dist/ を FTP またはGitHub Actions でアップロード
```

### コンテンツ更新（Strapi）

Strapi Cloud の管理画面からコンテンツを直接更新できます。  
フロントエンドの再ビルドは不要です。

---

## 切り戻し手順

### ロリポップ（frontend）

1. 旧バージョンの `dist/` をバックアップしておく
2. 問題が発生したら旧 `dist/` を FTP で上書きアップロード

GitHub Actions を使用している場合:

```bash
git revert HEAD
git push origin main
# Actions が自動で旧バージョンをデプロイ
```

### Strapi Cloud（backend）

Strapi Cloud のダッシュボードから過去のデプロイにロールバックできます。

---

## トラブルシューティング

### ページが真っ白になる

1. ブラウザの DevTools > Console でエラーを確認
2. `dist/.htaccess` が存在するか確認（SPA ルーティング）
3. 環境変数が正しく設定されているか確認
4. ビルドログに TypeScript エラーがないか確認

### API が取得できない（CORS エラー）

1. Strapi Cloud Dashboard で `FRONTEND_URL` が正しく設定されているか確認
2. `backend/config/middlewares.ts` の origin リストに本番ドメインが含まれているか確認
3. Strapi の Public Role 権限が設定されているか確認

### Clerk でログインできない

1. `VITE_CLERK_PUBLISHABLE_KEY` が `pk_live_...` を使用しているか確認
2. Clerk Dashboard の Allowed Origins に本番ドメインが登録されているか確認

---

## 関連ドキュメント

- [ロリポップデプロイ詳細](./deploy-lolipop.md)
- [Strapi Cloud デプロイ詳細](./deploy-backend-strapi-cloud.md)
- [開発環境セットアップ](./development-setup.md)
