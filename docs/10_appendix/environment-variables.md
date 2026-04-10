# 環境変数設定手順書

- 更新日: 2026-04-10
- 対象: frontend / backend
- 目的: 必須変数の抜け漏れを防ぐ
- 前提: frontend は `.env.example` あり、backend はテンプレ未同梱
- 関連ドキュメント: [deploy-manual](../09_operations/deploy-manual.md)

## 1. frontend 主な変数

| 変数 | 用途 |
|---|---|
| `VITE_SITE_TYPE` | `main/store/fanclub` 切替 |
| `VITE_SITE_URL` | 現在サイトURL |
| `VITE_MAIN_SITE_URL` | main絶対URL |
| `VITE_STORE_SITE_URL` | store絶対URL |
| `VITE_FANCLUB_SITE_URL` | fanclub絶対URL |
| `VITE_STRAPI_API_URL` | Strapi API |
| `VITE_STRAPI_API_TOKEN` | Strapi token |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerkキー |
| `VITE_FORMSPREE_CONTACT_ID` | 問い合わせフォームID |
| `VITE_FORMSPREE_REQUEST_ID` | 依頼フォームID |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe公開キー |

## 2. backend 主な変数（コードから抽出）

| 変数 | 用途 |
|---|---|
| `HOST`, `PORT` | サーバー起動 |
| `APP_KEYS` | Strapi app keys |
| `DATABASE_CLIENT` | sqlite/postgres など |
| `DATABASE_URL` | PostgreSQL接続 |
| `FRONTEND_URL` | CORS許可ドメイン追加 |
| `RATE_LIMIT_WINDOW_MS` | レート制限窓 |
| `RATE_LIMIT_MAX` | 窓あたり上限 |
| `STRIPE_SECRET_KEY` | Stripe秘密鍵 |
| `STRIPE_WEBHOOK_SECRET` | webhook署名 |
| `STRIPE_CHECKOUT_SUCCESS_URL` | 共通成功URL |
| `STRIPE_CHECKOUT_CANCEL_URL` | 共通キャンセルURL |
| `STRIPE_PORTAL_RETURN_URL` | portal戻り先 |
| `STRIPE_EXPECTED_MODE` | test/live整合確認 |

## 3. 要確認

- backend `.env.example` を新規追加し、運用者に配布することを推奨。
