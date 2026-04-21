# 会員ランク連動キャンペーン / シーズナル特典 / セグメント配信 / パーソナライズ施策 基盤整備（2026-04-21）

## 1. 現在の施策出し分け体験の課題
1. 会員価値表示 (`benefitVisibilityState`) と配信条件 (`campaignEligibility`) が画面ごとに分離され、同一理由追跡が弱かった。
2. main / store / fc で次アクション案内の基準が揃っておらず、再訪促進導線が一貫していなかった。
3. mypage / notification / support で `membershipStatus` と `memberRankState` を使った施策要約が不足していた。

## 2. 責務整理（campaign / personalization / seasonal perk）
- 新規 `resolveCampaignPersonalizationState` を追加し、以下を統合的に解決:
  - `campaignEligibilityState`
  - `seasonalEligibilityState`
  - `seasonalPerkState`
  - `offerVisibilityState`
  - `contentPriorityState`
  - `recommendationState`
  - `campaignWindowState`
  - `eligibilityReason` / `personalizationReason`
- 既存 `resolveBenefitExperienceState`（権利・表示）と `resolveMemberProgression`（ランク・進行）を利用し、責務混同を回避。

## 3. セグメント / eligibility 基盤整理
- CRM `SegmentContext` を拡張し、`campaignEligibilityState` / `seasonalEligibilityState` / `seasonalPerkState` / `offerVisibilityState` / `recommendationState` を追加。
- CRM シナリオ生成に `member_priority_campaign` / `seasonal_perk_highlight` / `reactivation_journey` / `offer_cooldown` を追加。

## 4. main / store / fc の施策出し分け強化
- 共通 UI `CampaignPersonalizationPanel` を導入し、main/store/fc で同じ正規化状態を表示。
- panel には「季節対象」「表示優先度」「推奨種別」「ランク」「next best action」を表示。

## 5. mypage / personalized hub / seasonal perk hub
- mypage パネルに施策状態要約（eligibility / visibility / next action）を追加。
- 会員価値表示と施策表示を同一導線で把握できるように整理。

## 6. notification / CRM / support / internal admin 接続整理
- notification 設定パネルに campaign / seasonal 状態表示を追加。
- support には共通 panel を追加し、問い合わせ前に同じ state モデルを参照可能化。
- internal admin は本PRでは型・表示追加未実施（次PR候補）。

## 7. loyalty / campaign / content value 接続
- `memberRankState` と `campaignEligibilityState` を同時評価して `contentPriorityState` を決定。
- grace / expired の再開訴求を `recommendationState=reactivation` で一貫化。

## 8. 計測イベント追加
- `CampaignPersonalizationPanel` で以下を送信:
  - `personalized_block_view`
  - `seasonal_perk_view`
  - `next_best_action_view`
  - `next_best_action_click`
  - `personalized_cta_click`
  - `campaign_banner_click`
  - `rejoin_offer_view`
  - `rejoin_offer_click`
- 付与属性: `sourceSite`, `lifecycleStage`, `membershipStatus`, `entitlementState`, `memberRankState`, `perkState`, `campaignEligibilityState`, `personalizationState`。

## 9. env / GitHub Secrets / runtime
- frontend `.env.example` に campaign / seasonal / recommendation の runtime flag を追加。
- backend `.env.example` に eligibility ruleset / cooldown / daily cap を追加。
- GitHub Secrets は既存運用（runtime secret と CI secret を分離）を継続し、今回の追加は Variables 側で管理する方針。

## 10. 確認手順
1. `npm run test:frontend`
2. `npm run lint --prefix frontend`
3. `npm run build:frontend`
4. `npm run build:backend`
5. main / store / fc / member / support で panel 表示と CTA を確認。

## 11. 残課題
- internal admin に `campaignEligibilityState` の履歴タイムラインを追加する。
- CRM 実配信ジョブで新シナリオキーを運用投入する。
- `lastOfferShownAt` など prompt history の API 永続化。

## 12. 仮定
1. `lastRetentionMessageAt` を `lastOfferShownAt` として暫定再利用してよい。
2. seasonal 判定はまず status + rank の rule-based で十分（外部カレンダー連動は次PR）。
3. 同一 panel を support に表示してもオペレーション UX を阻害しない。
