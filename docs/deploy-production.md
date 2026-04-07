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
       │  (frontend x3)  │    mizzz.jp / store.mizzz.jp / fc.mizzz.jp
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


## サブドメイン分離（main / store / fanclub）

2026-04 の運用から、frontend は同一コードベースを 3 ターゲットに分けてデプロイします。

- `main`: `https://mizzz.jp`（ホームハブ）
- `store`: `https://store.mizzz.jp`（Store）
- `fanclub`: `https://fc.mizzz.jp`（Fanclub）

GitHub Actions（`.github/workflows/deploy.yml`）では、`VITE_SITE_TYPE` と `VITE_SITE_URL` をターゲットごとに切り替えてビルドします。

### 追加で必要な GitHub Secrets

| 用途 | Secret |
|---|---|
| main FTP | `FTP_SERVER_MAIN` / `FTP_USERNAME_MAIN` / `FTP_PASSWORD_MAIN` / `FTP_SERVER_DIR_MAIN` |
| store FTP | `FTP_SERVER_STORE` / `FTP_USERNAME_STORE` / `FTP_PASSWORD_STORE` / `FTP_SERVER_DIR_STORE` |
| fanclub FTP | `FTP_SERVER_FC` / `FTP_USERNAME_FC` / `FTP_PASSWORD_FC` / `FTP_SERVER_DIR_FC` |

> 同一 FTP サーバー運用でも問題ありません。`*_DIR_*` で公開先ディレクトリだけ分離します。

### 追加で必要な frontend 環境変数

| 変数 | 例 | 説明 |
|---|---|---|
| `VITE_SITE_TYPE` | `main` / `store` / `fanclub` | ビルド対象サイト識別 |
| `VITE_SITE_URL` | `https://store.mizzz.jp` | canonical / og:url の基準 URL |
| `VITE_MAIN_SITE_URL` | `https://mizzz.jp` | クロスサイトリンク用 |
| `VITE_STORE_SITE_URL` | `https://store.mizzz.jp` | クロスサイトリンク用 |
| `VITE_FANCLUB_SITE_URL` | `https://fc.mizzz.jp` | クロスサイトリンク用 |


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
- [ ] `FRONTEND_URL` に main/store/fanclub をカンマ区切りで設定済み（CORS）
  - 例: `FRONTEND_URL=https://mizzz.jp,https://store.mizzz.jp,https://fc.mizzz.jp`
- [ ] コンテンツタイプが定義済み
- [ ] Public Role の `find` / `findOne` 権限が設定済み
- [ ] API トークンが発行済み

### 5. Clerk の設定

- [ ] Clerk Dashboard でドメインを登録
- [ ] Production インスタンスに切替（`pk_live_...` キー使用）
- [ ] Allowed Origins に本番ドメインを追加
- [ ] アカウント管理は main/store/fc で分割せず、1つの Clerk Production インスタンスに統一

### 5.1 Allowed Origins（Clerk / Formspree / Shopify 共通）

- [ ] `https://mizzz.jp`
- [ ] `https://store.mizzz.jp`
- [ ] `https://fc.mizzz.jp`

> 3サービスとも同じ 3ドメインを登録する。`https://` 固定・末尾 `/` なしで統一。

### 5.2 Store の問い合わせ導線

- [ ] Store の「お問い合わせ」は store 専用フォームではなく、main の Contact/Request ページへ遷移させる
- [ ] Formspree の本番フォームは main 側（`VITE_FORMSPREE_CONTACT_ID` / `VITE_FORMSPREE_REQUEST_ID`）で管理する

### 5.3 DNS（`store.mizzz.jp` / `fc.mizzz.jp`）

- [ ] ホスティング指定に従い、A または CNAME のどちらかで設定する
  - A: 事業者指定の IPv4 アドレスを設定
  - CNAME: 事業者指定のホスト名を設定
- [ ] 反映後、`https://store.mizzz.jp` / `https://fc.mizzz.jp` が正しいデプロイ先を表示することを確認

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
