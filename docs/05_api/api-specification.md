# API設計書

- 更新日: 2026-04-10
- 対象: frontend-backend連携
- 目的: エンドポイント、入出力、認証要件を整理する
- 前提: Strapi REST + 独自 payment routes
- 関連ドキュメント: [DB設計書](../06_database/database-design.md)

## 1. 主要API一覧

| 種別 | パス | 用途 | 認証 |
|---|---|---|---|
| GET | `/api/works` | 作品一覧 | 任意 |
| GET | `/api/news-items` | ニュース一覧 | 任意 |
| GET | `/api/blog-posts` | ブログ一覧 | 任意 |
| GET | `/api/fanclub-contents` | FCコンテンツ | 任意（表示はフロントで制御） |
| GET | `/api/store-products` | 商品一覧 | 任意 |
| GET | `/api/membership-plans` | FCプラン | 任意 |
| POST | `/api/payments/store/checkout-session` | 購入セッション生成 | 不要 |
| POST | `/api/payments/fanclub/checkout-session` | FC決済開始 | 必須(Clerk JWT) |
| POST | `/api/payments/customer-portal/session` | 顧客ポータルURL | 必須(Clerk JWT) |
| POST | `/api/payments/stripe/webhook` | Stripe通知受信 | Stripe署名 |

## 2. 代表API詳細

### 2.1 Store Checkout
- 入力: `productId`, `quantity`, `locale`, `userId?`
- 検証: 商品存在、購入可能、在庫、購入状態
- 出力: `url`, `sessionId`
- エラー: 400/404/500

### 2.2 Fanclub Checkout
- 入力: `planId`, `locale`
- 検証: Clerk token, planのjoinable, stripePriceId
- 出力: `url`, `sessionId`

### 2.3 Webhook
- 入力: Stripe event（署名必須）
- 処理: 重複防止ログ→payment/subscription記録→processed更新

## 3. エラー設計

- フロント: `StrapiApiError` を利用
- バック: `ctx.badRequest` / `ctx.notFound` / `ctx.internalServerError`

## 4. 要確認

- `API_ENDPOINTS` に存在するが backend 未定義の `shipments`, `member-notices`, `audit-logs` は将来拡張想定の可能性があるため運用前に棚卸しが必要。
