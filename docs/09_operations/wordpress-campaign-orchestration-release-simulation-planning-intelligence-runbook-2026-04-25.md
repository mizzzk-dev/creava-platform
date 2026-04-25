# WordPress cross-site campaign orchestration / release simulation / planning intelligence runbook（2026-04-25）

## 1. 目的
- 対象: `mizzz.jp`（main）/ `store.mizzz.jp`（store）/ `fc.mizzz.jp`（fanclub）。
- 目的: 「今の状況が見える」から「次に何をいつ誰が出すべきかを依存・リスク付きで判断できる」へ進める。
- 前提: WordPress 単独運用で preview / publish / revalidation / search / membership が稼働。

## 2. 現在の詰まり（今回PRでの棚卸し）
1. campaign planning が release calendar と分離し、cross-site の順序判断が手作業。
2. simulation が不足し、dependency / locale / cache / search / membership / workload 影響を同時に確認しづらい。
3. SLA 監視はあるが prediction と workload forecast が不足し、遅延予兆の説明が弱い。
4. operator の判断材料（summary / approval assist / checklist）が分散し、最終判断の再現性が低い。
5. weekly/monthly review テンプレートが planning intelligence 観点で統一されていない。

## 3. 状態設計（責務分離）
以下を分離して保持する。
- `campaignOrchestrationState`
- `crossSiteCampaignState`
- `releaseSimulationState`
- `launchChecklistState`
- `dependencyForecastState`
- `impactForecastState`
- `slaPredictionState`
- `workloadForecastState`
- `publishRiskScoreState`
- `operatorCopilotState`
- `approvalAssistState`
- `releaseWindowState`
- `readinessForecastState`
- `escalationForecastState`
- `planningSummaryState`
- `opsTraceId`
- `opsUpdatedAt`

> 方針: **simulation と actual publish を混同しない**、**SLA prediction と queue 現況を混同しない**、**copilot suggestion と最終承認を混同しない**。

## 4. 実装概要（WordPress plugin）
### 4-1. 新規 REST endpoint
- `GET /wp-json/creava/v1/ops/planning-bottlenecks`
- `GET /wp-json/creava/v1/ops/campaign-orchestration`
- `GET /wp-json/creava/v1/ops/release-simulation`
- `GET /wp-json/creava/v1/ops/planning-intelligence`
- `GET /wp-json/creava/v1/ops/operator-copilot`
- `GET /wp-json/creava/v1/ops/planning-review`

### 4-2. 各 endpoint の責務
- `planning-bottlenecks`: 現在の詰まり（dependency / locale / approval / launch）を可視化。
- `campaign-orchestration`: main/store/fc をまたぐ campaign grouping と locale rollout plan。
- `release-simulation`: dependency / locale / cache / search / membership / workload / SLA の影響を simulation。
- `planning-intelligence`: SLA prediction / publish risk score / workload forecast と根拠を返却。
- `operator-copilot`: summary / approval assist / checklist 提案（suggestion only）。
- `planning-review`: weekly/monthly review テンプレート、owner、predicted vs actual 用観点。

### 4-3. 安全設計
- auto publish / auto assign / risk override は既定無効。
- approval assist は常に suggestion で、manual review を前提。
- noisy 抑制のため score と explanation を同時表示。

## 5. frontend 連携（共通 provider）
`frontend/src/modules/settings/wordpressOps.ts` に以下 snapshot 型/取得関数を追加。
- `PlanningBottleneckSnapshot`
- `CampaignOrchestrationSnapshot`
- `ReleaseSimulationSnapshot`
- `PlanningIntelligenceSnapshot`
- `OperatorCopilotSnapshot`
- `PlanningReviewSnapshot`

これにより main/store/fc で共通の planning/simulation/campaign orchestration 基盤を利用できる。

## 6. weekly / monthly review 運用
### weekly planning review
- predicted vs actual SLA diff
- blocked dependency 解消率
- locale rollout slip
- operator workload imbalance
- high-risk launch follow-up

### launch readiness review
- simulation 結果
- checklist 完了率
- approval assist の根拠
- revalidation / cache scope の差分

### monthly retrospective
- throughput vs quality
- approval latency trend
- dependency failure pattern
- prediction precision 改善
- runbook 更新項目

## 7. env / secrets / ownership
### frontend 追加
- `VITE_WORDPRESS_CAMPAIGN_ORCHESTRATION_ENABLED`
- `VITE_WORDPRESS_RELEASE_SIMULATION_ENABLED`
- `VITE_WORDPRESS_PLANNING_INTELLIGENCE_ENABLED`
- `VITE_WORDPRESS_OPERATOR_COPILOT_ENABLED`
- `VITE_WORDPRESS_SLA_PREDICTION_ENABLED`
- `VITE_WORDPRESS_PUBLISH_RISK_MODEL_VERSION`
- `VITE_WORDPRESS_WORKLOAD_FORECAST_MODEL_VERSION`

### backend/runtime 追加
- `CREAVA_CAMPAIGN_ORCHESTRATION_LOOKAHEAD_DAYS`
- `CREAVA_RELEASE_SIMULATION_SAMPLE_LIMIT`
- `CREAVA_PUBLISH_RISK_SCORE_CRITICAL_THRESHOLD`
- `CREAVA_SLA_PREDICTION_AT_RISK_HOURS`
- `CREAVA_WORKLOAD_FORECAST_OVERLOAD_THRESHOLD`
- `CREAVA_OPERATOR_COPILOT_SUGGESTION_DAILY_CAP`

### ownership
- editorial planning owner: `editorial-ops`
- campaign orchestration owner: `release-ops`
- prediction owner: `ops-analytics`
- copilot owner: `operator-enable`

## 8. 確認手順
1. WordPress admin `Editorial Ops` 画面で section 11/12 が表示される。
2. 新規 endpoint が `403`（tokenなし）/ `200`（tokenあり）で期待通り返る。
3. `releaseSimulationState` と `publish` 実状態が混同されていない。
4. `operatorCopilotState` が warning でも自動 publish されない。
5. checklist / approval assist が suggestion-only で出る。

## 9. よくあるトラブル
- **症状:** simulation が常に warning。
  - **確認:** dependency graph の high severity と locale completeness。
- **症状:** risk score が高止まり。
  - **確認:** blocked queue / critical queue / at_risk count の内訳。
- **症状:** copilot 提案が多すぎる。
  - **確認:** `CREAVA_OPERATOR_COPILOT_SUGGESTION_DAILY_CAP` と mute/snooze。

## 10. 仮定
1. 既存 editorial dashboard / dependency graph / release calendar / workflow automation は利用可能。
2. WordPress 側 post meta（locale / access_status / seo / due_at）が一定品質で入る。
3. 現段は deterministic rule-based prediction を採用し、ML ベース最適化は次段。
4. Slack/メール等の通知統合は既存基盤に接続済み（本PRでは直接実装しない）。
5. cross-site campaign grouping は `sourceSite + locale` を初期キーとして実装する。
