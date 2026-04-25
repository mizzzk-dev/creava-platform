# WordPress campaign ROI dashboard / post-launch attribution / experiment feedback / budget-aware prioritization runbook（2026-04-25）

## 1. 目的
- 前段で整備した cross-site campaign orchestration / release simulation / planning intelligence を、公開後の評価と次施策優先度に接続する。
- main / store / fc を横断して、以下を**分離した状態**で確認できるようにする。
  - `campaignRoiState`
  - `postLaunchAttributionState`
  - `channelContributionState`
  - `contentRoiState`
  - `experimentFeedbackState`
  - `budgetImpactState`
  - `prioritizationScoreState`
  - `learningLoopState`

## 2. 現在の詰まり（今回の初期棚卸し）
1. dashboard はあるが、ROI・attribution・priority の責務が同一レイヤーで読まれやすい。
2. launch outcome の比較が site/locale/campaign 単位で統一されておらず、reviewer が BigQuery 生SQLに戻りがち。
3. experiment 結果が planning 側に戻る経路が弱く、weekly review がメモ止まりになりやすい。
4. score は見えるが「なぜその優先度か」の説明が不足し manual override の理由が散在。
5. low-signal / inconclusive の扱いが運用ごとにぶれ、過剰解釈リスクがある。

## 3. 今回の実装範囲

### 3-1. backend (`/api/internal/growth/dashboard`)
- campaign ROI / attribution / experiment feedback / prioritization を単一 API で返す。
- ただし値は混在させず、state と score を分離。
- `preview/internal` の除外を既定で有効化。
- `siteSummary` / `campaignRoi` / `channelContribution` / `experimentFeedback` / `prioritizationCandidates` / `learningQueue` を返す。
- weekly / monthly review template を API 応答に同梱。

### 3-2. frontend internal admin
- 「growth summary 更新」から上記 API を呼び出し。
- 画面上で state separation（ROI / attribution / channel / content / feedback / learning）を明示。
- prioritization は `nextBestActionState` と `reviewRequired` を分けて表示。
- raw JSON も表示し、operator が BigQuery 直読なしで一次判断できるようにした。

### 3-3. WordPress plugin (`/wp-json/creava/v1/ops/growth-outcome`)
- editorial ops dashboard に post-launch growth outcome セクションを追加。
- campaign orchestration / release simulation / planning intelligence を再利用し、growth 用 state を追加合成。
- 既定は suggestion-only（auto publish / auto budget shift なし）。

## 4. state 設計ポリシー
- `campaignRoiState` と `postLaunchAttributionState` は別。
- `channelContributionState` は寄与度であり、最終優先度ではない。
- `experimentFeedbackState` は publish 結果と混同しない。
- `prioritizationScoreState` は recommendation であり、approval の代替ではない。
- `forecastConfidenceState` が low の候補は manual review 優先。

## 5. weekly / monthly review 運用

### weekly launch outcome review
- campaignRoiState と attributionState を別軸で確認。
- predicted vs actual を比較し、乖離原因を 1 行で残す。
- low-signal / inconclusive は「保留」扱いにして断定しない。

### weekly prioritization review
- high score でも review gate を通す。
- budgetImpact / dependency / effort を同時比較。
- refresh / relaunch / retire / support の4候補で next action を選ぶ。

### monthly campaign retrospective
- site/locale/channel/content/membership の寄与差分を比較。
- cost vs outcome / effort vs impact を併記。
- repeated failure pattern を backlog に戻す。

## 6. ownership / review cadence
- growth dashboard owner: `ops-analytics`
- attribution definition owner: `growth-ops`
- prioritization rubric owner: `editorial-ops + release-ops`
- weekly review: `editor/reviewer/operator/growth`
- monthly retro: `publisher/admin/growth`

## 7. local / staging / production 確認手順
1. backend 起動後に `/api/internal/growth/dashboard` を取得できること。
2. internal admin から growth summary を更新し、state が表示されること。
3. WordPress `/wp-json/creava/v1/ops/growth-outcome` を ops token 付きで取得できること。
4. preview/internal 除外が効いていること（イベント件数の過大増加がない）。
5. PII / 会員自由入力本文が payload に含まれないこと。

## 8. よくあるトラブル
- `growth dashboard の権限がありません。`
  - internal permission (`internal.support.read`) の不足。
- campaignRoi が空配列
  - 期間内イベント不足、または preview/internal 除外で low-signal 化。
- prioritization が manual_review_required ばかり
  - attribution 安定度が不足。まず tagging / experiment linkage を優先。

## 9. 今回の PR での改善点（要約）
- launch 後分析を ROI/attribution/feedback/prioritization に分離。
- main/store/fc 比較と campaign drilldown を同一レスポンスに統合。
- weekly/monthly テンプレートを API で供給し、learning loop を運用へ接続。

## 10. 仮定
1. analytics-event / store-order / internal-audit-log が現行運用で参照可能。
2. campaignId / channel / experimentId は payload へ少なくとも部分的に付与済み。
3. BigQuery/Looker は補助的参照で、daily operation は internal admin を主導線にする。
4. prioritization は AI assist であり、publish/budget の自動確定は行わない。
