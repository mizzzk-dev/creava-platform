# Stripe 決済基盤整備（store.mizzz.jp / fc.mizzz.jp）

## 1. 現状確認結果
- 既存 store は `stripeLink` 外部リンク遷移ベースで、Checkout Session のサーバー生成は未実装。
- 既存 fanclub は入会UIが静的で、Subscription / Portal / Webhook 同期が未実装。
- Strapi は API とミドルウェア基盤（JSONエラー統一、レート制限、監査ログ）を既に保有。

## 2. Stripe 導入方針
- サーバー側（Strapi）で Stripe SDK を利用し、Checkout / Portal / Webhook を一元管理。
- store は単発 `mode=payment`、fc は継続課金 `mode=subscription` を分離。
- 決済確定は Webhook のみを正として扱い、フロントは「処理開始/案内」の役割に限定。

## 3. 追加した共通基盤
- `backend/src/lib/stripe/*` に client/env/idempotency/webhook を新設。
- `/api/payments/*` のカスタムエンドポイントを追加。
- raw body 検証用に `strapi::body` を `includeUnparsed: true` 化。

## 4. store 側の対応
- StoreDetail で Checkout Session 作成 API を呼ぶ Stripe 購入ボタンを追加。
- ローディング、エラー表示、二重送信防止を実装。
- `/checkout/success` `/checkout/cancel` を追加し、Webhook同期待ちを明示。

## 5. fc 側の対応
- membership plan（CMS）を読み込み、join ページからプランごとに Checkout 開始可能化。
- mypage に Customer Portal 起動導線を追加（customerId紐付け後に有効）。
- `/checkout/success` `/checkout/cancel` を追加。

## 6. Webhook / 同期
- Stripe-Signature 検証を実装。
- `webhook-event-log` に eventId を unique 保存し重複処理を回避。
- checkout / subscription イベントを payment-record / subscription-record に同期。

## 7. Strapi / CMS モデル
- 追加モデル: `order`, `payment-record`, `subscription-record`, `webhook-event-log`, `checkout-attempt`, `membership-plan`。
- store-product に追加: `stripeProductId`, `stripePriceId`, `productType`, `isPurchasable`, `stockStatus`, `saleStatus`, `metadataKey`。

## 8. 環境変数
- backend: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_*_SUCCESS_URL`, `STRIPE_*_CANCEL_URL`, `STRIPE_PORTAL_RETURN_URL`。
- frontend: `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_STRIPE_CUSTOMER_ID_DEMO`。

## 9. テスト/本番分離メモ
- test/live は Stripe key prefix (`sk_test_` / `sk_live_`) で判定。
- Webhook secret は test/live で必ず分離。
- success/cancel/portal return URL はサブドメイン別に個別設定。

## 10. 残課題
- Clerk user と Stripe customerId の本紐付けAPI（現状は demo env で代替）。
- `stripe` 依存の lockfile 反映（npm registry 制限によりこの環境で未取得）。
- Webhook イベント網羅（invoice/payment_intent 失敗系の業務ルール詳細）。
