# proactive support optimization / ranking / orchestration / experimentation runbook (2026-04-24)

## 0. 目的
- 対象: `mizzz.jp` main / `store.mizzz.jp` / `fc.mizzz.jp`
- 目的: proactive support 基盤を「表示できる状態」から「誰に何をいつどの順で出すと自己解決率が高いかを継続最適化できる状態」に進める。
- 本段階は **assisted optimization**（提案・分析・運用補助）を優先し、完全自動 close/publish/policy rollout は行わない。

## 1. 現状の弱点（改修前）
1. recommendation 候補生成と ranking 結果が分離されておらず、優先順位の改善理由が追いづらい。
2. proactive intervention と lifecycle-aware branching が暗黙的で、guest / member / grace / expired ごとの差分が運用に出しづらい。
3. experimentation / policy の状態が問い合わせ prefill に引き継がれず、support 側で改善サイクルが閉じない。
4. ranking の低信頼（low confidence）と handoff の必要性が同一扱いになりやすい。

## 2. 責務整理（混同禁止）
### user-facing state
- `recommendationState`: `not_evaluated | eligible | candidate_selected | shown | clicked | dismissed | suppressed`
- `rankingState`: `not_ranked | ranked | low_confidence | fallback_rule_applied | manual_override`
- `orchestrationState`: `not_started | active | branching | completed | suppressed | failed`
- `preventionOutcomeState`: `unknown | self_resolved | partially_resolved | still_need_support | handed_off_to_human | suppressed_due_to_low_confidence`

### optimization / internal state
- `candidateSetState`: `empty | generated | filtered | ranked`
- `rankingReason`: `known_issue_priority | semantic_retrieval_match | category_lifecycle_bias | low_confidence_fallback | member_state_priority`
- `orchestrationPolicyState`: `default | issue_first | assistant_first | handoff_accelerated | manual_review`
- `lifecycleAwareState`: `guest_journey | onboarding_like | membership_like | grace_like | expired_like | high_risk_journey`
- `experimentState`: `none | draft | running | paused | completed | invalidated`
- `policyState`: `inactive | active | under_review | deprecated`
- `policyEffectivenessState`: `unknown | effective | watch | ineffective`

> 重要: candidate があること、ranked されること、表示されること、実験対象になること、解決につながることは別状態。

## 3. 実装差分
### frontend
- `frontend/src/modules/support/proactiveOptimization.ts`
  - ranking / orchestration / lifecycle / experiment / policy state を集約。
  - candidate + recommendation を site/category/lifecycle 文脈で並べ替える `rankProactiveRecommendations` を追加。
  - Contact handoff 用の `buildOptimizationQueryParams` を追加。
- `frontend/src/modules/support/components/ProactiveSupportPanel.tsx`
  - ranked result を表示し、ranking/orchestration policy を UI に可視化。
  - `proactive_intervention_shown` / click event に rankingReason・variant を付与。
- `frontend/src/pages/support/SupportCenterPage.tsx`
  - optimization summary state を保持。
  - `proactive_ranking_logged` / `proactive_policy_evaluated` を送出。
  - Contact への prefill に ranking/orchestration/experiment/policy state を連携。
- `frontend/src/pages/ContactPage.tsx`
  - prefill parameter を拡張し、support handoff へ carry-over。
- `frontend/src/modules/contact/components/SupportAssistPanel.tsx`
  - proactive + ranking + orchestration + policy 状態を表示（ユーザー入力の再説明削減）。

### backend
- `backend/src/api/analytics-event/controllers/analytics-event.ts`
  - 以下イベントを ALLOWED_EVENTS に追加。
    - `proactive_intervention_shown`
    - `proactive_ranking_logged`
    - `proactive_policy_evaluated`

## 4. inquiry / handoff / case prefill の扱い
- recommendation ranking と actual case creation は分離。
- Contact 遷移時に state を query で引き継ぎ、フォーム送信後の support thread 文脈に接続する。
- handoff suggestion は recommendation の一種であり、case created と同義ではない。

## 5. known issue / knowledge gap / feedback loop
- known issue 優先度は rankingReason で説明可能化。
- low confidence は fallback で assistant / inquiry 導線へ接続し、断定表示を回避。
- recommendation feedback は `help_article_feedback` / proactive event と合わせて評価（単独で解釈しない）。

## 6. セキュリティ・権限制御
- user-facing には recommendation / ranking の結果のみ露出し、internal scoring detail や internal note は露出しない。
- support-only / internal-only article の公開判定は既存 visibility 制御を維持。
- policy/experiment はログ中心にし、publish 操作は既存 admin 権限前提で運用。

## 7. 環境変数 / Secrets
### frontend (`frontend/.env.example`)
- `VITE_PROACTIVE_RANKING_STRATEGY`
- `VITE_PROACTIVE_EXPERIMENT_DEFAULT_STATE`
- `VITE_PROACTIVE_POLICY_DEFAULT_STATE`

### backend (`backend/.env.example`)
- `SUPPORT_PROACTIVE_POLICY_ENGINE_VERSION`
- `SUPPORT_PROACTIVE_EXPERIMENT_GUARDRAIL_MODE`
- `SUPPORT_PROACTIVE_RANKING_MIN_CONFIDENCE`

### GitHub Secrets / Variables（推奨）
- `ANALYTICS_OPS_TOKEN`
- `ANALYTICS_IP_HASH_SALT`
- `VITE_ANALYTICS_OPS_ENDPOINT`
- `SUPPORT_PROACTIVE_POLICY_ENGINE_VERSION`

## 8. 確認手順（local/staging/production 共通）
1. Support Center で検索語を入力。
2. proactive panel で ranking badge（`rankingState / orchestrationPolicyState`）が表示される。
3. suggestion click 後、analytics に `proactive_intervention_click` が記録される。
4. Contact 遷移 URL に ranking/orchestration/experiment/policy state が付与される。
5. Contact の pre-form panel に carry-over が表示される。
6. backend analytics public endpoint で追加イベントが reject されない。

## 9. low-confidence / repeated-handoff / failure の見方
- low-confidence: `rankingState=low_confidence` と `rankingReason=low_confidence_fallback` を優先確認。
- repeated handoff: `proactive_intervention_click`（handoff type）と case conversion を期間比較。
- ranking failure: candidate あり + click 低下 + still_need_support 上昇を knowledge gap 候補として扱う。

## 10. よくあるトラブル
- panel が出ない: `VITE_PROACTIVE_SUPPORT_ENABLED` / `VITE_PROACTIVE_SUPPORT_MIN_SCORE` を確認。
- event reject: backend の ALLOWED_EVENTS 未反映を確認。
- prefill 欠落: URLSearchParams のキー名（snake_case）不一致を確認。

## 11. 残課題（次PR候補）
- personalized ranking model（feature store 連携）
- multilingual recommendation tuning / article localization feedback loop
- policy template 管理 UI
- proactive experiment dashboard（運用画面）
- recommendation accuracy tracking（offline evaluation）

## 12. 仮定
- support thread / inquiry trace id / case prefill の既存基盤は稼働中。
- known issue 情報は status API から public に取得可能。
- internal admin / operations dashboard は analytics event からサマリを構築できる。
