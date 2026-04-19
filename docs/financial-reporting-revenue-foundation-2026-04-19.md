# 売上 / 会計 / 請求 / 返金 / レポーティング基盤整備（2026-04-19）

## 0. 目的
store (`store.mizzz.jp`) を中心に、main/fc/auth/user sync/billing/order/support/internal admin を跨いだ financial state の基盤を整備し、運用・経営の両方で数値の根拠を追える状態を作る。

---

## 1. 現在の売上 / 会計 / レポート運用課題（調査結果）

1. **payment / order / subscription はあるが revenue 正規化モデルが無い**
   - `payment-record` は決済イベント単位、`order` は受注運用単位、`subscription-record` は契約単位で、**会計集計専用の state が不在**。
2. **refund / partial refund の会計反映が弱い**
   - 既存 webhook は `checkout.session.completed` と subscription 更新中心で、`charge.refunded` による反映が不足。
3. **internal admin はユーザー照会/注文照会中心**
   - 収益サマリ（gross/net/refund/失敗件数/サイト別）が UI 上で確認しづらい。
4. **support で「なぜこの数字か」を説明しづらい**
   - CSV export や financial event の追跡導線が十分でない。

---

## 2. 責務分離（payment / order / refund / revenue / reporting）

- **payment state**: 決済処理の生状態（成功/失敗/返金）
- **order state**: 受注〜配送〜返品の運用状態
- **refund state**: full/partial refund の進行状態
- **revenue state**: 集計用の正規化状態（gross/net/refund/discount/shipping/tax）
- **reporting state**: 期間集計/サマリ生成/CSV 出力

今回、`revenue-record` を追加して revenue/reporting を独立。

---

## 3. 実装概要

### 3-1. backend: revenue-record 追加
- 新規 content-type: `revenue-record`
- 主な属性:
  - `revenueType`, `revenueSource`, `revenueStatus`
  - `recognizedAt`, `grossAmount`, `netAmount`, `discountAmount`, `shippingFee`, `taxAmount`
  - `refundAmount`, `partialRefundAmount`, `currency`, `sourceSite`
  - `orderId`, `subscriptionId`, `paymentId`, `refundId`, `userId`
  - `campaignId`, `couponId`, `loyaltyImpactState`
  - `reportPeriod`, `summaryState`, `syncState`, `sourceOfTruth`
  - `financialEventType`, `financialEventAt`, `eventIdempotencyKey`

### 3-2. backend: internal revenue API
- `GET /api/internal/revenue/summary`
  - gross/net/refund/shipping/discount/tax
  - failed/canceled/refunded 件数
  - sourceSite 別、revenueType 別、日次/月次
- `GET /api/internal/revenue/records`
  - 明細の検索・一覧
- `GET /api/internal/revenue/export.csv`
  - 運用用 CSV 出力

### 3-3. backend: webhook 反映強化
- `checkout.session.completed`
  - store/fc を分離して revenue record を upsert
- `charge.refunded`
  - full / partial refund を判定して revenue 反映
  - 対応 order の `paymentStatus` / `refundStatus` 更新
- `invoice.payment_failed`
  - fc 側の failed 課金イベントを revenue に記録

### 3-4. frontend: internal admin 改修
- Internal Admin 画面に financial summary セクション追加
  - サイトフィルタ（all/store/fc）
  - 集計表示（gross/net/refund/件数）
  - `bySourceSite` / `byRevenueType` 表示
  - CSV export 実行

---

## 4. store / fc 売上定義（今回の整理）

- **store**: 商品販売売上（order/checkout 起点）
- **fc**: 会費継続収益（subscription/invoice 起点）

同一ダッシュボードで表示しても `revenueType` と `sourceSite` で意味を分離する。

---

## 5. refund / cancel / return の数字反映ルール

- `charge.refunded` を契機に `refund` または `partial_refund` を計上。
- `order.returnStatus` と `refundStatus` は同一視しない。
- 返品受付だけでは売上減算しない（返金イベントが source of truth）。

---

## 6. internal admin / support 運用

- support は order lookup + revenue summary + CSV の 3点で一次切り分け。
- 経営確認は summary、監査は records/export で明細追跡。

---

## 7. env / secrets / CI 整理

- runtime env / GitHub Secrets へ `REVENUE_EXPORT_MAX_ROWS` を追加推奨。
- 既存 `STRIPE_*` webhook 設定を revenue 同期の一次情報として運用。
- **DNS変更不要**（既存ドメインと webhook 受信経路をそのまま利用）。

---

## 8. 失敗ケースと切り分け

1. paid なのに売上に出ない
   - webhook-event-log に `checkout.session.completed` があるか
   - `revenue-record` の idempotency key 重複/失敗有無
2. refund が反映されない
   - `charge.refunded` 受信有無
   - paymentIntentId と order 紐付け可否
3. fc 会費と store 売上が混ざる
   - `sourceSite` / `revenueType` のフィルタ
4. summary と明細ズレ
   - reportPeriod/sourceSite filter 条件の不一致

---

## 9. 残課題（次PR候補）

- 請求書 / 領収書 / 税区分（軽減税率・複数税率）
- chargeback / dispute の厳密処理
- 経営 KPI（AOV, refund rate, retention revenue）の可視化強化
- support 向け返金ワークフロー UI（承認/却下/監査ログ）

---

## 10. 法務・会計の注意

- 売上計上タイミング・税務処理・適格請求書対応は、現行運用/税理士方針と突き合わせて**要確認**。
