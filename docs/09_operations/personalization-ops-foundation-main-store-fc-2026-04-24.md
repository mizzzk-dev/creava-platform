# personalization ops foundation runbook（main / store / fc, 2026-04-24）

## 1. 現在の personalization 基盤の問題点（実装調査）
- 既存は `useExperiment` 中心で、assignment / exposure は扱えるが、**eligibility / holdout / personalization decision / registry** が experiment 文脈に埋没していた。
- main / store / fc / support で出し分け対象はあるが、同じ taxonomy で横断比較する仕組みが不足していた。
- impression 重複抑止は experiment ごとに分散しており、personalization の運用概念（segment, guardrail, rollback）が明示化されていなかった。
- consent / preview / internal / bot 除外の判定はあるが、「personalization 判定」としては一元化されていなかった。

## 2. 今回導入した taxonomy / segment / KPI / holdout / guardrails

### 2-1. 追加した状態（state）
- personalizationState
- personalizationVariantState
- personalizationImpressionState
- personalizationAssignmentState
- personalizationEligibilityState
- personalizationSegmentState
- personalizationSuccessMetricState
- personalizationGuardrailState
- personalizationHoldoutState
- personalizationDecisionState
- personalizationRollbackState
- personalizationConsentState
- personalizationSeoState
- personalizationAccessibilityState
- personalizationTraceId
- personalizationStartedAt / personalizationShownAt

### 2-2. 命名ルール
- ID: `{site}-{surface}-{objective}-{period}`（例: `store-listing-assist-2026q2`）
- holdout は `control` 扱いとし、**assignment と exposure を分離**。
- metric key は `site_metric_intent` 形式（例: `store_add_to_cart_rate`）。

### 2-3. 共通判定パラメータ
- `sourceSite`, `locale`, `deviceType`, `referrerType`, `trafficQualityState`, `personalizationTraceId`。
- user property は最小化し、PII・自由入力本文・会員個人識別情報は送信禁止。

## 3. audience segmentation / assignment / impression 基盤
- `frontend/src/modules/personalization/ops.ts` を追加。
- 共通フック `usePersonalization` で以下を実施。
  - segment assignment（new_visitor / returning / member / high_intent）
  - eligibility 判定（consent / traffic quality）
  - sticky assignment（localStorage）
  - holdout 判定（hash bucket + holdoutRate）
  - impression dedupe（path 単位）
  - assignment event / impression event を分離送信
- preview / internal / bot は `excluded + holdout` として production 判定から分離。

## 4. main / store / fc / support への適用
- main: `main-hub-routing-2026q2`
  - home の section ordering 変更判定を personalization で統一。
- store: `store-listing-assist-2026q2`
  - hero/ranking/CTA variant を personalization 判定に接続。
- fc: `fc-join-guidance-2026q2`
  - join/login hero messaging の variant 判定を personalization 判定に接続。
- support: `support-recommendation-path-2026q2`
  - help center quick link ordering を personalization 判定に接続。

## 5. BigQuery / Looker Studio / Clarity 接続方針
- 既存 analytics stream に以下イベントを追加。
  - `personalization_assignment_logged`
  - `personalization_impression_logged`
  - `personalization_decision_logged`（次PRで実装予定）
- taxonomy 上は experimentation category に配置し、既存 pipeline と整合。
- dashboard 側は assignment / impression / conversion / holdout を別軸で集計する。

## 6. holdout / registry / rollout / rollback / review workflow
- registry は `PERSONALIZATION_REGISTRY`（実装定義）を source of truth とする。
- rollout は holdoutRate を維持しつつ段階展開、guardrail breach で即 rollback。
- review は週次で以下を必須確認。
  - success metric
  - secondary metric
  - guardrail
  - holdout 比較
  - decision（adopt / rollback / inconclusive）

## 7. privacy / consent / SEO / accessibility alignment
- consent 未許可は impression を `suppressed` として送信抑止。
- internal / preview / bot を production personalization 判定から除外。
- SEO 安全性 state を definition に保持（現状は `safe` のみ）。
- client-only personalization の乱用を防ぐため、影響領域を home/store/fc/support の UI 並び替えに限定。

## 8. env / runtime / docs 運用

### frontend env（追加）
- `VITE_PERSONALIZATION_RUNTIME_ENABLED`
- `VITE_PERSONALIZATION_DEFAULT_HOLDOUT_RATE`
- `VITE_PERSONALIZATION_REGISTRY_VERSION`
- `VITE_PERSONALIZATION_EXCLUDE_INTERNAL`
- `VITE_PERSONALIZATION_EXCLUDE_PREVIEW`
- `VITE_PERSONALIZATION_EXCLUDE_BOT`
- `VITE_PERSONALIZATION_DEBUG`

### runbook 運用手順（最小）
1. proposal で KPI / guardrail / holdoutRate / owner を決定。
2. registry へ ID 追加。
3. staging で assignment / impression / dedupe を確認。
4. production rollout。
5. weekly review で decision を記録。
6. 採用時は release flag へ昇格、停止時は rollback。

## 9. 残課題（次PR）
- personalization decision logging UI（review / close / archive）
- registry 管理画面（運用者向け）
- BigQuery 側の専用 mart / Looker Studio テンプレート
- recommender の online learning（現状は rule-based）

## 10. 仮定
- GA4 / GTM / BigQuery Export / Looker Studio / Clarity / experimentation pipeline は既存運用済み、または運用開始直前。
- 本PRでは backend schema 追加は行わず、frontend event taxonomy 追加で既存 ingest に接続可能とした。
- personalization の即時最適化（bandit / real-time score）は scope 外とした。
