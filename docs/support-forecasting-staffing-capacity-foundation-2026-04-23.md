# support forecasting / staffing / capacity / surge / coverage 基盤整備（2026-04-23）

## 1. 背景と現状課題
- 既存基盤では inquiry thread / queue / SLA / QA / CSAT は扱えるが、**繁忙期に同じ指標で体制判断**するための state が不足していた。
- 「件数増加」「人員不足」「SLA崩壊危険」「急増」「恒常不足」を個別 state で追える設計が薄く、運用判断が属人化しやすかった。

## 2. 今回追加した責務分離
- `forecastState` / `forecastConfidenceState`: 予測状態と信頼度を分離。
- `staffingState` / `coverageState` / `coverageGapState`: 人員状態とカバレッジ不足を分離。
- `surgeState` / `surgeReason` / `seasonalLoadState`: 一時的急増と季節性を分離。
- `capacityRiskState` / `capacityActionState`: 危険度と推奨アクションを分離。
- `staffingRecommendationState` / `mitigationSuggestionState` / `surgePlaybookState`: 提案と実施を分離。

## 3. 保存基盤と timeline
- inquiry schema に forecast/staffing/capacity/surge/coverage の専用属性を追加。
- `supportForecastSummary` / `staffingSummary` / `capacitySummary` / `surgeSummary` / `coverageSummary` で explainable な snapshot を保存可能化。
- `supportLastForecastedAt` などの監査向け timestamp を追加。
- `opsCaseUpdate` で capacity 系 state を独立更新できるよう拡張し、`caseMetadata.transitionHistory` に状態遷移を記録。

## 4. API 追加
- `GET /api/inquiry-submissions/ops/capacity`
  - lookback 期間の問い合わせを集計し、`workloadSummary`・`supportForecastSummary`・`staffingSummary`・`capacitySummary`・`surgeSummary`・`coverageSummary` を返却。
  - `recommendations` に staffing / surge playbook / backlog mitigation の提案を返却。
  - rule-based 判定で開始し、危険な自動体制変更は行わない。

## 5. 判定ロジック（初期）
- baseline: `INQUIRY_FORECAST_LOOKBACK_DAYS` を母数に日次平均を算出。
- surge: 当日件数が baseline 比 `INQUIRY_FORECAST_SURGE_RATIO` を超える、または high/urgent 集中時に `surgeState=active/suspected`。
- coverage: `INQUIRY_COVERAGE_CASES_PER_ASSIGNEE` で `covered/thin/gap_detected/critical_gap` を判定。
- capacity risk: overdue/delayed/surge/coverage/high-priority 比率の合成スコアで `low/medium/high/critical`。

## 6. env / secrets 追加
- `INQUIRY_FORECAST_LOOKBACK_DAYS`
- `INQUIRY_FORECAST_SURGE_RATIO`
- `INQUIRY_COVERAGE_CASES_PER_ASSIGNEE`
- `INQUIRY_SURGE_HIGH_PRIORITY_RATIO`

> いずれも backend runtime env。frontend には露出しない。

## 7. 確認手順
1. `INQUIRY_OPS_TOKEN` を付与して `GET /api/inquiry-submissions/ops/capacity` を実行。
2. `forecastState / staffingState / coverageState / surgeState / capacityRiskState` が同時に返ることを確認。
3. `recommendations` が suggestion 形式（accept/dismiss 前提）であることを確認。
4. `opsCaseUpdate` で capacity 系 state 更新時に `caseMetadata.transitionHistory` へ履歴が残ることを確認。

## 8. 失敗時の確認
- 401: `INQUIRY_OPS_TOKEN` ヘッダ誤り。
- データ不足: `forecastState=insufficient_data` が返る想定。
- surge 過検知: `INQUIRY_FORECAST_SURGE_RATIO` を引き上げて再評価。

## 9. 未対応（次PR候補）
- staffing calendar / shift planning との直接連携。
- forecast accuracy tracking（予測誤差の継続測定）。
- incident 種別別の surge playbook 自動提案精度改善。

## 10. 仮定
- support queue データは `inquiry-submission` へ集約済みである。
- ops token 保護 API を internal admin backend 連携で利用する運用を継続する。
- 現段階は assisted planning を優先し、完全自動 staffing 変更は導入しない。
