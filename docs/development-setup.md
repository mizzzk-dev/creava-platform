# 開発環境セットアップガイド

このドキュメントでは、creava-platform をローカルで動かすための手順を説明します。

## 前提条件

| ツール | 推奨バージョン |
|---|---|
| Node.js | 20.x 以上（22.x 推奨） |
| npm | 8.x 以上 |
| Git | 最新 |

## リポジトリ構成

```
creava-platform/
├── frontend/   # React + Vite（静的ビルド → ロリポップへデプロイ）
├── backend/    # Strapi v5（CMS / API → Strapi Cloud へデプロイ）
└── docs/       # ドキュメント
```

---

## 1. リポジトリのクローン

```bash
git clone https://github.com/mizzzk-dev/creava-platform.git
cd creava-platform
```

---

## 2. 依存パッケージのインストール

```bash
# frontend + backend まとめてインストール
npm run install:all
```

個別にインストールする場合:

```bash
npm install --prefix frontend
npm install --prefix backend
```

---

## 3. 環境変数の設定

### frontend

```bash
cp frontend/.env.local.example frontend/.env.local
```

`.env.local` を開いて必要な値を設定してください。

| 変数名 | 説明 | 必須 |
|---|---|---|
| `VITE_STRAPI_API_URL` | Strapi API の URL（ローカル: `http://localhost:1337`） | 推奨 |
| `VITE_STRAPI_API_TOKEN` | Strapi API トークン（パブリックアクセスなら空可） | 任意 |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk 認証キー（未設定でも動作） | 任意 |
| `VITE_SHOPIFY_STORE_DOMAIN` | Shopify ドメイン（将来用） | 任意 |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Shopify トークン（将来用） | 任意 |
| `VITE_FORMSPREE_CONTACT_ID` | Formspree お問い合わせID | 任意 |
| `VITE_FORMSPREE_REQUEST_ID` | Formspree 仕事依頼ID | 任意 |

> **最小構成:** 何も設定しなくても起動できます。  
> - Strapi 未設定 → ストアはモックデータで表示、他ページは空リスト  
> - Clerk 未設定 → 認証機能が無効化（FC限定コンテンツは guest 扱い）  

### backend

```bash
cp backend/.env.local.example backend/.env
```

`.env` を開いて `APP_KEYS` など最低限のシークレットを設定してください。  
開発用なのでランダム値でも動作しますが、本番値は使わないでください。

---

## 4. ローカル起動

### frontend のみ（Strapi なしで確認）

```bash
npm run dev:frontend
```

ブラウザで `http://localhost:5173` を開く。

- ストアはモックデータで表示されます
- News / Blog / Works / Fanclub は空リストになります（Strapi 未起動のため）

### frontend + backend 両方起動

ターミナル 1:

```bash
npm run dev:backend
```

ターミナル 2:

```bash
npm run dev:frontend
```

- backend: `http://localhost:1337`
- frontend: `http://localhost:5173`
- Strapi 管理画面: `http://localhost:1337/admin`

---

## 5. Strapi 初回セットアップ

backend を初めて起動すると、管理者アカウント作成画面が表示されます。

1. `http://localhost:1337/admin` を開く
2. 管理者アカウント（メール / パスワード）を作成
3. コンテンツタイプを定義する（詳細は [`backend-setup.md`](./backend-setup.md) を参照）
4. Settings > API Tokens でトークンを発行
5. `frontend/.env.local` の `VITE_STRAPI_API_TOKEN` に設定

---

## 6. よくあるエラーと対処

### `VITE_STRAPI_API_URL が設定されていません`

**原因:** `frontend/.env.local` が存在しない、または `VITE_STRAPI_API_URL` が空  
**対処:** `frontend/.env.local` を作成し、`VITE_STRAPI_API_URL=http://localhost:1337` を設定  
**補足:** ストアページはモックデータで動作するので、他を確認したい場合は設定してください

---

### `Missing publishableKey`（画面が白くなる）

**原因:** `VITE_CLERK_PUBLISHABLE_KEY` に無効な値が設定されている  
**対処:** 値を空にするか、正しい `pk_test_...` キーを設定する  
**補足:** 空または未設定なら Clerk は完全に無効化され、正常動作します

---

### Strapi 起動後に CORS エラーが出る

**原因:** `backend/config/middlewares.ts` の CORS 許可オリジンに `localhost:5173` が含まれていない  
**対処:** `backend/config/middlewares.ts` を確認し、`origin` 配列に `http://localhost:5173` があることを確認

```typescript
// backend/config/middlewares.ts
origin: [
  'http://localhost:5173',
  'http://localhost:4173',
  // ...
],
```

---

### `Cannot access '...' before initialization`（本番ビルドで白画面）

**原因:** 循環参照による TDZ（Temporal Dead Zone）エラー  
**対処:** `src/lib/routeConstants.ts` と `src/lib/routes.tsx` の分離は実施済み。  
新しいページを追加する際に `routes.tsx` からページコンポーネントをインポートしないこと。

---

### `npm run dev:backend` が `strapi command not found` で失敗

**原因:** `backend/node_modules` が未インストール  
**対処:**

```bash
npm install --prefix backend
```

---

## 7. 開発時の確認ポイント

| 機能 | 確認方法 |
|---|---|
| Strapi 接続 | `http://localhost:1337/_health` が `{"status":"ok"}` を返すか |
| CORS 確認 | ブラウザの DevTools > Network で `/api/...` リクエストが通るか |
| FC 制御確認 | Clerk でログイン/ログアウトし、`fc_only` コンテンツの表示切替を確認 |
| Store mock | `VITE_STRAPI_API_URL` を空にして `http://localhost:5173/store` を開く |

---

## 関連ドキュメント

- [frontend セットアップ詳細](./frontend-setup.md)
- [backend セットアップ詳細](./backend-setup.md)
- [本番デプロイ](./deploy-production.md)
