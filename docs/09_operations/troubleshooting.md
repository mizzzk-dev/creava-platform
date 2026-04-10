# トラブルシューティング

- 更新日: 2026-04-10
- 対象: 障害一次対応
- 目的: よくある障害の初動を統一する
- 前提: ログ閲覧可能
- 関連ドキュメント: [operations-manual](./operations-manual.md)

## 1. APIがHTMLを返す

- 症状: `StrapiApiError` で HTML 応答警告
- 確認: `VITE_STRAPI_API_URL`, CORS, Strapi稼働状態

## 2. FCページに入れない

- 確認順:
  1. Clerkキー設定
  2. ログイン状態
  3. メール認証
  4. 会員契約状態（active/grace/cancel_scheduled）

## 3. 決済は成功したが反映されない

- Stripe webhook 到達確認
- `webhook-event-log` に received/processed があるか
- `payment-record` / `subscription-record` 生成有無

## 4. Form送信できない

- `VITE_FORMSPREE_CONTACT_ID` / `REQUEST_ID` 設定確認
- 添付ファイル形式・サイズ制約確認

## 5. 429 が多発

- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` を確認
- botアクセスの可能性を監視
