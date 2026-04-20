# renewal / lifecycle messaging / win-back 基盤整備（2026-04-19）

## 1. 現在の継続率改善課題
1. `membershipStatus` だけで UI を出し分ける箇所が多く、`renewalState` / `billingState` / `lifecycleMessageState` が薄かった。
2. grace / failed payment / expired で「次に何をすれば戻れるか」がページ単位で弱く、support 依存が高かった。
3. mypage の account summary が生の状態表示中心で、更新・再開・再入会の導線が弱かった。
4. CRM セグメントに renewal / win-back の正規化シナリオが不足していた。
5. 計測イベントは lifecycle CTR を直接追える命名に揃っていなかった。

## 2. renewal / win-back lifecycle 責務整理
### 2.1 状態責務
- `accountStatus`: アカウント可用性（凍結・制限など）。
- `membershipStatus`: 会員区分（member/grace/expired/canceled）。
- `subscriptionState`: 契約ライフサイクル。
- `billingState`: 課金処理状態。
- `entitlementState`: 現在利用できる権利。
- `renewalState`: 更新進行（upcoming/due/grace/failed/expired/reactivated）。
- `renewalWindowState`: UI上の窓状態（renewal_soon/due_now/grace_window/rejoin_window）。
- `lifecycleMessageState`: 何を案内済みか（renewal_pending/grace_notice_sent/winback_sent/suppressed）。

### 2.2 追加した lifecycle summary 項目
- `renewalState`, `renewalWindowState`
- `reactivationEligibility`, `winbackEligibility`
- `renewalDueAt`, `nextBillingAt`, `expiredAt`, `paymentFailureAt`
- `lastRetentionMessageAt`, `lastRenewalNoticeAt`, `lastWinbackNoticeAt`

## 3. renewal 前導線整備
- main/store/fc/mypage の共通 `UserLifecycleBanner` で renewal soon / due を専用案内化。
- CTA を `renewal_cta_click` に統一し、非強制文言で更新価値（最近の更新・特典確認）を先に提示。
- banner 表示イベント `renewal_banner_view` を追加。

## 4. grace / failed payment / expired 導線整備
- grace: `grace_notice_view` + `grace_recovery_cta_click`。
- payment failed: `payment_fix_cta_click`。
- expired/canceled: `rejoin_banner_view` + `rejoin_cta_click`。
- suspended/restricted: `support_from_renewal_state` に統一。

## 5. main / store / fc の継続導線強化
- 3サイトで同一 banner を利用し、Logto 認証分離なしで user state に応じて案内。
- `renewalState` をイベント payload に含め、サイト別の導線差分を比較可能化。

## 6. mypage / account summary / renewal hub 整理
- account summary に `renewalState` / `billingState` / `nextBillingAt` / `graceEndsAt` / `statusReason` を追加。
- lifecycle 状態に応じた CTA セット（更新・支払い修正・再開・再入会・support）を実装。
- technical 名称の生表示を避けるためラベル変換を導入。

## 7. notification / CRM / support / internal admin 接続整理
- CRM segment builder で `renewal_nudge` / `grace_recovery` / `winback_offer` を追加。
- backend `user-sync/me` から renewal/win-back 判定に必要な正規化状態を返却。
- support/admin は既存 summary で同じ正規化状態を参照可能。

## 8. loyalty / benefit / content value 接続整理
- member/renewal/reactivation 状態で `member_value_block_view` を送信。
- 更新導線を「請求修正」だけでなく特典再認知導線に接続。

## 9. 計測追加内容
- 追加イベント:
  - `renewal_banner_view`
  - `renewal_cta_click`
  - `renewal_summary_view`
  - `grace_notice_view`
  - `grace_recovery_cta_click`
  - `payment_fix_cta_click`
  - `rejoin_banner_view`
  - `rejoin_cta_click`
  - `reactivation_success`
  - `member_value_block_view`
  - `renewal_help_click`
  - `support_from_renewal_state`
  - `lifecycle_message_sent`
  - `lifecycle_message_clicked`
  - `winback_offer_view`
  - `winback_offer_click`

## 10. env / GitHub Secrets / runtime / docs 整理
### frontend env
- `VITE_RENEWAL_REMINDER_DAYS`
- `VITE_GRACE_RECOVERY_DAYS`
- `VITE_WINBACK_WINDOW_DAYS`
- `VITE_LIFECYCLE_MESSAGE_COOLDOWN_HOURS`

### backend env
- `RENEWAL_REMINDER_DAYS`
- `RENEWAL_DUE_WINDOW_DAYS`
- `GRACE_RECOVERY_WINDOW_DAYS`
- `WINBACK_ELIGIBLE_DAYS`
- `LIFECYCLE_MESSAGE_COOLDOWN_HOURS`
- `LIFECYCLE_MESSAGE_DAILY_CAP`

## 11. 動作確認手順
1. `member` + `renewalState=upcoming` で renewal banner と CTA が出る。
2. `membershipStatus=grace` で grace 導線が出る。
3. `billingState=failed` で payment fix CTA が出る。
4. `membershipStatus=expired/canceled` で rejoin 導線が出る。
5. analytics publicTrack で新イベントが拒否されない。

## 12. 追加/修正ファイル一覧
- `frontend/src/lib/auth/lifecycle.ts`
- `frontend/src/components/common/UserLifecycleBanner.tsx`
- `frontend/src/hooks/useUserLifecycleApi.ts`
- `frontend/src/pages/MemberPage.tsx`
- `frontend/src/modules/crm/types.ts`
- `frontend/src/modules/crm/segments.ts`
- `frontend/src/locales/{ja,en,ko}/common.json`
- `backend/src/api/app-user/controllers/app-user.ts`
- `backend/src/api/app-user/content-types/app-user/schema.json`
- `backend/src/api/analytics-event/controllers/analytics-event.ts`
- `frontend/.env.example`
- `backend/.env.example`

## 13. 残課題
- rule-based から automation（配信キュー/再送制御）への昇格。
- personalized offer / loyalty campaign との実データ接続。
- support/admin UI で lifecycle message history の可視化画面追加。

## 14. 仮定
1. `subscription-record` / `entitlement-record` は今後も最新1件参照で summary を構成できる。
2. `lastRetentionMessageAt` などは未投入時 `null` を許容する。
3. renewal hub の一次導線は mypage 内 CTA で十分で、専用ページは次PRで対応可能。
