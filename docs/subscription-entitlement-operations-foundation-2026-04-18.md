# 課金 / サブスク / Entitlement / 会員同期 運用基盤整備（2026-04-18）

## 0. 目的
- Logto + user-sync + internal admin を前提に、Stripe の課金イベントとアプリ認可を分離する。
- payment state / subscription state / entitlement state / accessLevel の責務混同を減らす。
- mypage / support / internal admin で「今どういう契約状態か」「なぜ見えないのか」を追跡しやすくする。

> DNS変更不要（既存 `mizzz.jp` / `store.mizzz.jp` / `fc.mizzz.jp` / `auth.mizzz.jp` 構成のまま運用可能）。

---

## 1. 現在の課金 / 会員状態管理課題（調査結果）
1. `subscription-record` は Stripe 生状態に近く、`billingStatus` / `entitlementState` / `syncState` など運用上重要な正規化状態が不足。
2. `app-user` の `membershipStatus` は `subscriptionStatus` 文字列の簡易判定で更新され、grace/cancel の境界が曖昧。
3. webhook は重複 event 検知はあるが、失敗ログの `failed` 更新・再試行判断情報が薄い。
4. mypage はローカルストレージ中心で、実契約状態（更新日・請求状態・権利状態）の表示が弱い。
5. internal admin summary は billing/entitlement のサマリが薄く、support の一次切り分けに時間がかかる。

---

## 2. 今回の設計整理（責務分離）

### 2.1 状態モデル
- **payment state**: 決済単位（成功/失敗/返金）を `payment-record` で管理。
- **subscription state**: 契約単位（期間・更新・解約意志・同期版数）を `subscription-record` で管理。
- **entitlement state**: 利用権利単位（active/grace/inactive + entitlementSet）を `entitlement-record` で管理。
- **accessLevel**: UI/認可で使う簡約レベル。entitlement から導出し、provider 生状態は直接使わない。

### 2.2 source of truth
- Stripe webhook を billing 側 source of truth とする。
- frontend の success/cancel リダイレクトでは状態確定しない（同期完了待ち）。

---

## 3. 実装サマリ

### 3.1 Backend
- `subscription-record` に次を追加:
  - `billingStatus`, `entitlementState`, `entitlementSet`, `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `canceledAt`, `renewalDate`, `trialState`, `gracePeriodState`, `syncState`, `syncVersion`, `sourceOfTruth`, `lastBillingEventAt`。
- 新規 `entitlement-record` content type を追加:
  - `entitlementState`, `entitlementSet`, `campaignEligibility`, `earlyAccessEligibility`, `syncState`, `syncVersion`, `sourceOfTruth` など。
- `payment.stripeWebhook` を強化:
  - subscription event 時に正規化 state を計算。
  - `subscription-record` を upsert し、`entitlement-record` も同期。
  - `app-user` の membership/access を同期更新。
  - 例外時は `webhook-event-log` を `failed` + `errorMessage` で保存。
- `user-sync/me` と `internal summary` に `billingSummary` / `entitlementSummary` を追加。

### 3.2 Frontend (mypage)
- `/api/user-sync/me` を bearer token で取得し、以下を表示:
  - membershipStatus / accessLevel
  - subscriptionStatus / billingStatus / renewalDate
  - entitlementState / entitlementSet / syncState / sourceOfTruth
- 既存のテーマ・多言語運用を壊さないよう、最小追加でカードを増設。

---

## 4. webhook / 冪等 / 再同期運用
- duplicate event: `webhook-event-log.eventId(unique)` で拒否。
- out-of-order: 最新 snapshot 上書き運用（`syncVersion` を単調増加）。
- failed event: `webhook-event-log.status=failed` + `errorMessage` を運用監視対象にする。
- 再同期: 将来 `internal admin` から subscriptionId 指定の backfill/replay API を追加予定（本PRでは設計余地まで）。

---

## 5. access control 上の方針
- payment 状態と entitlement を直結しない。
- `past_due` は即剥奪せず `grace_period` 扱いを許容。
- backend 認可は entitlement/accessLevel 参照を基本にし、表示制御だけに依存しない。

---

## 6. support / internal admin で見える化した項目
- 現在の subscriptionStatus / billingStatus / renewalDate
- cancelAtPeriodEnd / canceledAt
- entitlementState / entitlementSet
- syncState / syncVersion / sourceOfTruth

これにより「課金は通っているが権利が付いていない」「webhook 未達で遅延している」などを切り分けやすくする。

---

## 7. CRM / loyalty / notification 接続方針
- `campaignEligibility` / `earlyAccessEligibility` を entitlement 基準で保持。
- CRM segment は payment raw ではなく normalized state を参照。
- loyalty は `membershipStatus` と分離し、施策判定条件を混同しない。

---

## 8. env / secrets / CI

### 8.1 runtime env（backend）
- 必須（既存）
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_CHECKOUT_SUCCESS_URL`
  - `STRIPE_CHECKOUT_CANCEL_URL`
  - `STRIPE_PORTAL_RETURN_URL`
- 運用推奨（今回追記）
  - `BILLING_GRACE_PERIOD_DAYS`
  - `BILLING_SYNC_RETRY_LIMIT`
  - `BILLING_SYNC_RETRY_DELAY_MS`

### 8.2 GitHub Secrets / Variables
- Secrets（環境ごとに分離）
  - `STRIPE_SECRET_KEY_STAGING`, `STRIPE_SECRET_KEY_PRODUCTION`
  - `STRIPE_WEBHOOK_SECRET_STAGING`, `STRIPE_WEBHOOK_SECRET_PRODUCTION`
  - `LOGTO_M2M_APP_SECRET_STAGING`, `LOGTO_M2M_APP_SECRET_PRODUCTION`
- Variables
  - `STRIPE_EXPECTED_MODE` (`test` / `live`)
  - `STRIPE_*_URL` 系

---

## 9. 失敗ケースと一次対応
1. **支払い失敗**: `billingStatus` と `gracePeriodState` を確認。grace中なら即剥奪しない。
2. **webhook 未達**: `webhook-event-log` に event が無い。Stripe dashboard 配信ログ確認。
3. **duplicate event**: `duplicated: true` 応答なら正常。
4. **反映遅延**: `syncState` と `lastBillingEventAt` を確認。
5. **entitlement 反映漏れ**: `subscription-record` と `entitlement-record` の `subscriptionId` 整合確認。
6. **解約反映漏れ**: `cancelAtPeriodEnd` / `canceledAt` / `currentPeriodEnd` の値を確認。

---

## 10. 残課題（次PR候補）
- support 用「手動再同期」API（subscriptionId / customerId 指定）。
- 複数プラン・バンドル entitlement への拡張。
- billing history UI の正式実装。
- 再開導線（reactivation）専用の UX と通知テンプレ整備。

---

## 11. 仮定
- Stripe を継続採用する前提（他 provider 併用は未実装）。
- app-user と Logto user の 1:1 紐付けは成立済み。
- subscription record の履歴用途は保ちつつ、最新 snapshot を更新運用してよい前提。
