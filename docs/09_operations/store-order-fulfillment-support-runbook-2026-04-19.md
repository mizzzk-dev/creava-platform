# store 注文 / 配送 / 返品交換 / CS 運用基盤 Runbook（2026-04-19）

## 目的
- Stripe 決済イベントを source of truth として注文確定する。
- payment / order / fulfillment / shipment / return / refund / inventory の責務を分離する。
- mypage と internal admin から注文状態を追跡しやすくする。
- **DNS変更不要**（既存 `mizzz.jp` / `store.mizzz.jp` / `fc.mizzz.jp` / 既存 API を利用）。

## 現状課題（実装前）
1. `checkout.session.completed` で `payment-record` のみ作成し、`order` が自動生成されない。
2. 注文・配送状態が `order` に十分保持されず、mypage / support の可視性が低い。
3. internal admin に order lookup がなく、user lookup と照合が手作業になる。
4. 在庫減算の責務と注文確定の責務が分かれておらず、二重減算防止が弱い。

## ドメイン責務分離
- paymentStatus: 決済プロバイダ状態（pending/paid/failed/refunded など）
- orderStatus: 受注ライフサイクル（placed/confirmed/canceled/completed/exception）
- fulfillmentStatus: 出荷準備責務（unfulfilled/preparing/fulfilled/failed）
- shipmentStatus: 配送責務（not_shipped/in_transit/delivered/returned/failed）
- returnStatus / refundStatus: 返品受付と返金進行を分離
- inventoryReservationState / inventoryCommitState: 在庫確保と確定を分離

## checkout 後処理フロー
1. frontend は checkout session を作成（既存）。
2. Stripe webhook `checkout.session.completed` を受信。
3. `webhook_event_log` で eventId 重複を遮断（idempotency）。
4. payment-record を作成。
5. `metadata.checkoutKind=store` の場合、order を upsert。
6. 新規 order のみ在庫 commit を実施（既存 order は再減算しない）。
7. `syncState` と `auditMetadata` に結果を記録。失敗時は `needs_manual_review`。

## 失敗時ハンドリング
- paid だが order がない: webhook log で event 処理状態確認し再同期。
- 在庫不足で order exception: `inventoryCommitState=rolled_back` とし support が手動調整。
- duplicate webhook: eventId 重複で no-op。

## mypage 仕様（今回）
- `GET /api/orders/me` で注文一覧を取得。
- `GET /api/orders/me/shipments` で配送一覧を取得。
- ユーザー向け状態へ正規化して表示（内部状態を露出しすぎない）。

## internal admin 仕様（今回）
- `GET /api/internal/orders/lookup?query=...`
- 検索キー: `orderNumber/email/userId/billingCustomerId/paymentIntentId/checkoutSessionId`
- 支払い・注文・配送・返品・返金状態を同一行で確認。

## env / secrets / CI
- backend: `ORDER_*`, `INVENTORY_*` を追加（運用パラメータ用）。
- frontend: order lookup UI の feature flag 追加。
- GitHub Secrets は既存 Stripe / Logto secret を再利用（追加 secret 必須なし）。

## support 一次調査手順
1. orderNumber で internal lookup。
2. paymentStatus と orderStatus を分離確認。
3. fulfillment/shipment 進捗と return/refund 進捗を確認。
4. `syncState=needs_manual_review` は manual resync 対象としてエスカレーション。

## 今後の拡張（次PR候補）
- 配送業者 API 連携（tracking 自動反映）。
- 返品 request ワークフロー自動化。
- reservation 在庫（TTL 付き）と partial fulfillment。
- campaignId / loyaltyAppliedState の自動付与。
