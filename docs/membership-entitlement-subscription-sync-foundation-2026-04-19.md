# membershipStatus / entitlement / subscription / notification / CRM 同期基盤整備（2026-04-19）

## 1. 現在の status 同期課題
- `membershipStatus` は存在するが、`subscriptionState` / `billingState` / `entitlementState` の責務分離が frontend claim 解釈で弱かった。
- lifecycle API で `statusReason` / `statusUpdatedAt` が取得できず、support と CRM で「なぜこの状態か」を説明しづらかった。
- banner 計測イベント名が `renewal_cta_click` など一部不統一だった。

## 2. 今回の責務整理
- `membershipStatus`: 会員区分そのもの（non_member/member/grace/...）。
- `subscriptionState`: 契約ライフサイクル（none/trialing/active/past_due/canceled/expired）。
- `billingState`: 課金処理状態（clear/pending/failed/refunded/disputed）。
- `entitlementState`: 現在利用可能な権利状態（inactive/active/limited/grace/blocked）。

## 3. 実装内容（コード）
- frontend の `AppUser` に `subscriptionState` / `billingState` / `entitlementState` を追加。
- Logto claim 正規化で `subscriptionState` / `billingState` / `entitlementState` を導出。
- lifecycle summary に `membershipStatus` / `subscriptionState` / `billingState` を追加。
- backend `user-sync/me` の `lifecycleSummary` に `subscriptionState` / `billingState` / `statusReason` / `statusUpdatedAt` を追加。
- CTA 計測名を `renew_cta_click` / `status_based_banner_click` へ統一。

## 4. main / store / fc / mypage / support 反映方針
- UI 出し分けは `membershipStatus` + `entitlementState` を中心に維持。
- support / internal は `statusReason` / `statusUpdatedAt` で根拠追跡性を補強。
- CRM / notification は `subscriptionState` と `billingState` をセグメント軸に追加可能。

## 5. 計測イベント
- 継続: `account_summary_view`
- 更新: `renew_cta_click`, `rejoin_cta_click`, `status_based_banner_click`
- 今後追加推奨: `membership_status_changed`, `subscription_state_changed`, `entitlement_state_changed`

## 6. env / GitHub Secrets / runtime
- frontend 追加:
  - `VITE_MEMBERSHIP_STATE_SYNC_INTERVAL_SEC`
- backend 追加:
  - `USER_STATE_RECONCILE_INTERVAL_MIN`
  - `USER_STATE_SYNC_MAX_DRIFT_MINUTES`
- GitHub Secrets/Variables は `docs/10_appendix/environment-variables.md` の一覧に追記。

## 7. 動作確認
1. `/api/user-sync/me` の `lifecycleSummary` に `subscriptionState` / `billingState` / `statusReason` / `statusUpdatedAt` が出る。
2. member page で account summary 計測時に entitlement/subscription が payload に含まれる。
3. grace 状態で banner CTA のイベントが `renew_cta_click` になる。

## 8. 残課題
- 状態遷移イベント（changed 系）の server 側 emit は次PRで webhook/event log と接続。
- internal admin の UI で state history timeline を可視化する画面は未実装。
- renewal automation / loyalty trigger は未対応。

## 9. 仮定
1. subscription-record の `subscriptionStatus` / `billingStatus` は source of truth として利用可能。
2. entitlement-record に `statusReason` を将来追加可能（現状は null 許容）。
3. frontend claim に state が未搭載でも fallback で破綻しない前提。
