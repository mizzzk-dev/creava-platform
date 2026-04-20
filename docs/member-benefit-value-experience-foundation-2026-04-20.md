# 会員特典 / 限定公開 / 先行公開 / パーソナライズ表示 基盤整備（2026-04-20）

## 1. 現在の会員価値体験の課題
1. `membershipStatus` / `entitlementState` は存在するが、UI の表示責務（teaser / emphasized）とアクセス制御責務（member-only）が混在していた。
2. main / store / fc で会員価値訴求の導線が別実装で、表示条件が統一されていなかった。
3. mypage は account summary が中心で、利用可能特典の「見える化」が弱かった。
4. CRM シナリオ生成で `benefitVisibilityState` / `earlyAccessState` を参照できず、価値訴求メッセージが単調になりやすかった。

## 2. benefit / gating / visibility 責務整理
- 新規で `BenefitExperienceState` を定義し、以下を明示分離。
  - `membershipStatus`: 会員区分
  - `entitlementState`: 利用権利
  - `subscriptionState` / `billingState`: 契約・課金
  - `benefitVisibilityState`: UI上の見せ方
  - `accessGateState`: 実アクセス制御
  - `earlyAccessState`: 先行公開状態
  - `memberPerkState`: 特典の有効/強調状態
  - `personalizationState`: パーソナライズ段階
- lifecycle claim に `lastBenefitPromptAt` / `lastMemberValueShownAt` を追加し、訴求履歴の追跡余地を確保。

## 3. 限定公開 / 先行公開基盤整理
- 共通 resolver (`resolveBenefitExperienceState`) を追加し、main/store/fc/mypage で同じ判定ロジックを利用。
- 会員でない状態でも teaser を表示し、価値を伝えつつ member-only 制御と分離。
- grace / expired で CTA を変え、更新・再開導線を優先。

## 4. main / store / fc の会員価値導線強化
- `MemberValueExperiencePanel` を追加し、3サイトに配置。
- main: ハブとして限定公開・先行公開・再開導線を要約表示。
- store: 購買導線を阻害しない位置で先行販売/会員特典導線を提示。
- fc: FC コンテンツ一覧前に価値説明と状態別CTAを表示。

## 5. mypage / member summary / benefit hub 整理
- mypage に `MemberValueExperiencePanel` を追加。
- personalization panel で benefit hub 要約（visibility / early access）を表示。
- `benefit_hub_view` 計測を追加し、状態別の閲覧状況を追跡。

## 6. notification / CRM / support / internal admin 接続整理
- CRM segment context に `benefitVisibilityState` / `accessGateState` / `earlyAccessState` / `personalizationState` を追加。
- lifecycle scenarios に `benefit_teaser` / `early_access_prompt` / `cross_site_value` を追加し、価値訴求条件を強化。
- notification center で同じ normalized benefit state を使って、状態別メッセージ（join / renew / reactivate / explore）を出し分け。
- support center の問い合わせ前ブロックで benefit state を要約し、`support_from_benefit_state` 計測とマイページ導線を追加。
- internal admin の User Summary に benefit visibility / access gate の要約表示を追加し、support 問い合わせ時の状態確認を容易化。

## 7. loyalty / campaign / content value 接続整理
- member value panel を横断導線として導入し、loyalty/campaign ブロックの上流に置ける状態を作成。
- `memberPerkState` / `benefitPriority` を将来の seasonal perk / rank 制御に拡張しやすい型で定義。

## 8. 計測追加内容
- 追加イベント: `member_benefit_block_view`, `member_benefit_cta_click`, `benefit_hub_view`。
- 追加イベント: `benefit_prompt_clicked`, `support_from_benefit_state`。
- イベント共通属性: `sourceSite`, `lifecycleStage`, `membershipStatus`, `entitlementState`, `benefitVisibilityState`。
- 既存候補イベント（`member_only_teaser_view` / `early_access_block_view` / `rejoin_value_block_view`）は CTA payload の `eventLabel` として送出。

## 9. env / GitHub Secrets / runtime / docs 整理
- frontend `.env.example` / `.env.production.example` に会員価値体験制御の env を追加。
- backend `.env.example` に benefit prompt / early access window / dedupe 関連 env を追加。
- `docs/10_appendix/environment-variables.md` に新規 env と runtime/CI 責務を追記。

## 10. 動作確認結果
- `npm run lint --prefix frontend`
- `npm run test:frontend`
- `npm run build:frontend`

## 11. 追加 / 修正ファイル一覧（今回PR）
- `frontend/src/lib/auth/benefitPresentation.ts`
- `frontend/src/modules/notifications/components/NotificationSettingsPanel.tsx`
- `frontend/src/pages/support/SupportCenterPage.tsx`
- `frontend/src/pages/internal/InternalAdminPage.tsx`
- `docs/member-benefit-value-experience-foundation-2026-04-20.md`

## 12. 残課題
- backend 認可APIで `accessGateState` を直接返す endpoint 拡張。
- support / internal admin の benefit prompt history タイムライン UI。
- lifecycle message history と CRM 配信履歴の統合ビュー。

## 13. 仮定
1. claim へ `lastBenefitPromptAt` / `lastMemberValueShownAt` を追加可能である。
2. 現行の `role` は internal admin 用権限として維持し、会員判定は `membershipStatus` 優先でよい。
3. `member_benefit_*` 系イベントは既存 analytics pipeline で受信可能である。
