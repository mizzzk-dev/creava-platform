# multilingual support optimization / translation memory / glossary / locale retrieval runbook（2026-04-24）

## 1. 目的
- multilingual support knowledge 基盤を、継続改善可能な optimization 基盤へ進める。
- 対象: `mizzz.jp` / `store.mizzz.jp` / `fc.mizzz.jp` の support center・help center・assistant・inquiry handoff。
- translation の「存在」と「品質」と「検索解決寄与」を分離し、運用/分析を同一モデルで扱う。

## 2. 現在の弱い点（今回の現状確認）
1. 翻訳があるかどうかは見えるが、translation memory 再利用・用語統一・workflow 遅延が同じ指標で追えない。
2. locale fallback は追えるが、locale retrieval の品質（weak / fallback_heavy / risky）を operations で比較しづらい。
3. locale-aware handoff に翻訳資産や glossary の文脈が不足し、ケース起票後の再確認負荷が残る。
4. regional policy template の適用状態が recommendation/ranking と分離されておらず、運用改善が遅くなる。

## 3. 責務分離（state モデル）
### localization / workflow
- `localizationState`: 翻訳対象としての状態。
- `localizationWorkflowState`: キュー・進行・レビュー・公開の運用状態。
- `localizationVariantState`: source/translated/fallback_rendered の表示状態。

### translation memory / glossary
- `translationMemoryState`: none/partial/matched/reused/needs_review。
- `translationMemoryMatchState`: no_match/fuzzy/exact/conflicting。
- `glossaryState`: not_defined/draft/active/deprecated。
- `glossaryConsistencyState`: consistent/minor_drift/inconsistent/blocked。

### retrieval / ranking / policy
- `localeRetrievalState`: not_evaluated/healthy/weak/fallback_heavy/review_needed。
- `retrievalQualityState`: unknown/acceptable/needs_tuning/risky。
- `localeRankingState`: not_ranked/ranked/low_confidence/fallback_applied。
- `regionalPolicyTemplateState`: draft/active/under_review/deprecated。
- `regionalPolicyState`: inactive/active/under_review/deprecated。

### handoff / effectiveness
- `localeHandoffState` と `localeCasePrefillState` を分離（提案と実起票を混同しない）。
- `localeEffectivenessState` と `localeKnowledgeGapState` で locale 改善優先度を決める。

## 4. 実装反映ポイント
- `frontend/src/modules/support/localeSupportOps.ts`
  - translation memory / glossary / retrieval / workflow / policy template state を追加。
  - `articleLastMemoryMatchedAt` / `articleLastGlossaryCheckedAt` を保持。
- `frontend/src/modules/support/multilingualOptimization.ts`
  - locale summary から optimization summary を組み立てる共通モジュールを新設。
  - 重複実装を避け、support center / analytics / dashboard 連携で再利用する。
- `frontend/src/pages/support/SupportCenterPage.tsx`
  - optimization summary を表示し、`multilingual_optimization_summary_logged` を送信。
  - 問い合わせ導線へ workflow/memory/glossary/retrieval/policy state を carry-over。
- `frontend/src/modules/support/components/ConversationalHelpAssistant.tsx`
  - handoff prefill に translation memory / glossary / retrieval / policy state を追加。

## 5. 運用確認手順
1. `/support` で locale を切り替え、`multilingualOptimization` 表示が更新されることを確認。
2. 検索結果 0件・少件数・fallback 発生で state が変化することを確認。
3. assistant から handoff し、問い合わせ URL に下記が載ることを確認。
   - `translation_memory_state`
   - `glossary_consistency_state`
   - `locale_retrieval_state`
   - `localization_workflow_state`
   - `regional_policy_template_state`
4. analytics イベント `multilingual_optimization_summary_logged` を確認。

## 6. env / runtime
- 追加した frontend env:
  - `VITE_SUPPORT_TRANSLATION_MEMORY_MIN_MATCH_SCORE`
  - `VITE_SUPPORT_TRANSLATION_WORKFLOW_AUTOMATION_ENABLED`
  - `VITE_SUPPORT_GLOSSARY_DRIFT_ALERT_THRESHOLD`
  - `VITE_SUPPORT_LOCALE_RETRIEVAL_LOW_CONFIDENCE_THRESHOLD`
  - `VITE_SUPPORT_REGIONAL_POLICY_TEMPLATE_DEFAULT`

## 7. セキュリティ
- internal note / review note は継続して user-facing に出さない。
- handoff query に内部本文は含めず、state と要約のみ carry-over する。
- publish/disable/policy 変更などの権限付き操作は backend 側で監査を前提に扱う。

## 8. 失敗時の確認
- locale state が常に同じになる場合:
  - `document.documentElement.lang` と `VITE_SUPPORT_LOCALE_DEFAULT` を確認。
- retrieval が `risky` 固定になる場合:
  - search result 件数・filter 条件・category 選択を確認。
- glossary drift が過検知になる場合:
  - `VITE_SUPPORT_GLOSSARY_DRIFT_ALERT_THRESHOLD` の閾値を見直す。

## 9. 未対応（次PR）
- translation memory automation（segment 単位の提案保存）。
- multilingual semantic retrieval のスコアチューニング実験。
- glossary governance dashboard（internal admin 向け）。
- regional policy template rollout automation。

## 10. 仮定
- source language は現時点で `ja` を真実源として扱う。
- translation memory/glossary の永続化は既存CMS構造へ段階導入する前提で、今回は state とイベント基盤を先行した。
- support case/thread/inquiry 保存基盤は既存実装が利用可能である前提。
