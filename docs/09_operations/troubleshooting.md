# トラブルシューティング

- 更新日: 2026-04-18
- 対象: 障害一次対応
- 目的: よくある障害の初動を統一し MTTR を短縮する
- 前提: ログ閲覧可能
- 関連: [operations-manual](./operations-manual.md), [production-reliability-runbook](./production-reliability-runbook.md)

## 1. まず最初に確認すること（5分以内）

1. monitoring workflow の失敗箇所（どのURLか）
2. backend `/_health` / `/_ready` の結果
3. 影響範囲（main / store / fc / CMS / form / auth）
4. ユーザー報告に `requestId` があれば控える

## 2. API が HTML を返す

- 症状: `StrapiApiError` で HTML 応答警告
- 確認:
  1. `VITE_STRAPI_API_URL`
  2. Strapi 側 `json-api-error` ログ
  3. CORS 設定と reverse proxy

## 3. backend が ready にならない

- `/_health` は ok だが `/_ready` が degraded の場合:
  1. DB 接続情報（`DATABASE_*`）
  2. DB 側メンテ / ネットワーク遮断
  3. readiness timeout (`READINESS_TIMEOUT_MS`)

## 4. FC ページに入れない

1. Logto 設定値 (`VITE_LOGTO_*`) を確認
2. callback URL / post logout URL の環境差分を確認
3. ログイン状態・会員状態・メール認証を確認

## 5. 決済は成功したが反映されない

1. Stripe webhook 到達確認
2. `webhook-event-log` に `received/processed` があるか
3. `payment-record` / `subscription-record` 生成有無

## 6. Form 送信できない

1. `POST /api/inquiry-submissions/public` の status / response body を確認
2. 添付ファイルの MIME / size / max files を確認
3. `x-request-id` で backend log を追跡
4. `INQUIRY_OPS_TOKEN` を使う ops API が生きているか確認

## 7. 429 が多発

1. `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`
2. `rate-limit` ログの `ipHash` 集中有無
3. bot 由来なら WAF / CDN 側制御を追加検討

## 8. CMS 公開が反映されない

1. Draft/Publish 状態
2. Strapi API 応答（publicationState）
3. frontend cache / build 配信差分

## 9. 復旧判断

- 15分以内に復旧見込みがない場合は切り戻し判断へ移行。
- 切り戻し後、health/readiness と主要導線確認を必ず実施。
