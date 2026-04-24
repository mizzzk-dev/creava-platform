# translation memory / glossary / multilingual semantic retrieval improvement / article localization workflow automation / locale-specific ranking tuning / regional policy templates runbook（2026-04-24）

## 0. この runbook の目的
- multilingual support knowledge を「運用できる状態」から「継続改善できる状態」へ進める。
- translation memory / glossary / locale retrieval / localization workflow / regional policy template を分離し、日次運用で改善サイクルを回せるようにする。
- main / store / fc の support 導線を壊さず、問い合わせ前 self-service と handoff を自然につなぐ。

## 1. 現在の multilingual support optimization が弱い原因
1. locale ごとの検索失敗（no-result / low-confidence）と翻訳資産再利用（TM/用語集）の因果が運用画面で分断される。
2. article localization の進行状態と翻訳品質状態が同じ文脈で扱われやすく、レビュー優先順位が崩れる。
3. locale-aware handoff に retrieval・workflow・policy の carry-over が不足し、case 起票後に再ヒアリングが発生しやすい。
4. regional policy template の適用状況が summary で見えにくく、地域ごとの改善施策を比較しにくい。

## 2. 責務整理（混同禁止）
- localizationState: 翻訳記事そのものの存在/公開状態。
- localizationWorkflowState: ローカライズ運用フロー（queue/review/publish）の状態。
- translationMemoryState / translationMemoryMatchState: 再利用候補の有無・一致度。
- glossaryState / glossaryConsistencyState: 用語集の定義状態と実記事の整合。
- localeRetrievalState / retrievalQualityState: locale 検索品質（見つかるか/信頼できるか）。
- localeEffectivenessState: locale 体験として自己解決に寄与しているか。
- regionalPolicyTemplateState / regionalPolicyState: 地域テンプレートの整備状態と適用状態。
- localeHandoffState / localeCasePrefillState: 問い合わせ接続の準備状態。

## 3. 基盤整備（今回）
### frontend
- `frontend/src/modules/support/multilingualOpsAutomation.ts`
  - translation reuse coverage / workflow automation / locale ranking tuning / regional policy template coverage を導出。
  - contact handoff に渡す query params を一元化。
- `frontend/src/pages/support/SupportCenterPage.tsx`
  - multilingual ops automation summary を生成。
  - analytics event `multilingual_ops_automation_logged` を追加。
  - proactive 問い合わせ導線へ automation context を carry-over。
- `frontend/src/modules/support/components/ConversationalHelpAssistant.tsx`
  - assistant handoff URL に automation context を付与。
- `frontend/src/pages/ContactPage.tsx`
  - handoff query param の新規 state を prefill context へ取り込み。
- `frontend/src/modules/contact/components/SupportAssistPanel.tsx`
  - contact 前パネルで localization ops state を可視化。

### docs / env
- frontend/backend の `.env.example`、および `docs/10_appendix/environment-variables.md` に automation/ranking/template 指標の運用変数を追加。

## 4. localized help / search / suggestion / troubleshooting
- `SupportCenterPage` で locale summary と multilingual optimization summary を継続利用。
- no-result / low-confidence / fallback は従来の `localeSupportSummary` で判定し、automation summary は改善優先度づけに限定。
- assistant / proactive どちらの問い合わせ導線でも、同一の locale optimization context を引き継ぐ。

## 5. locale-aware handoff / case prefill / fallback
- handoff URL に以下を追加し、support 側で読み取れるようにする。
  - `translation_reuse_coverage_state`
  - `localization_workflow_automation_state`
  - `locale_ranking_tuning_state`
  - `regional_policy_template_coverage_state`
- 既存の retrieval / glossary / policy state は維持し、互換性を壊さない。

## 6. analytics / feedback / knowledge loop
- 新規イベント `multilingual_ops_automation_logged` で、改善対象 locale を可観測化。
- translation memory 再利用率だけでは解決成功を断定せず、`localeEffectivenessState` と併読する運用を徹底。

## 7. support center / notification / operations dashboard 接続
- support center から contact へ context carry-over を統一。
- notification / operations dashboard 側は、query param と analytics event の双方で状態把握可能。

## 8. セキュリティ・安定性
- 追加した state は summary 文字列のみで、秘密情報・内部ノート・未公開記事本文を含めない。
- user-facing で表示する state は内部レビュー本文と分離。

## 9. env / GitHub Secrets / runtime
### frontend
- `VITE_SUPPORT_TRANSLATION_REUSE_HIGH_THRESHOLD`
- `VITE_SUPPORT_LOCALE_RANKING_TUNING_TRIGGER`
- `VITE_SUPPORT_REGIONAL_POLICY_TEMPLATE_MIN_COVERAGE`

### backend
- `INQUIRY_TRANSLATION_REUSE_LOW_THRESHOLD`
- `INQUIRY_LOCALE_RANKING_TUNING_THRESHOLD`
- `INQUIRY_REGIONAL_POLICY_TEMPLATE_MIN_COVERAGE`

> すべて「閾値/状態導出」用途。secrets は不要。

## 10. 確認手順
1. `/support` を開き、検索や locale 切替で `multilingual_ops_automation_logged` が送信される。
2. assistant から問い合わせ導線へ進み、URL に 4 つの automation state が含まれる。
3. proactive パネルから問い合わせ導線へ進み、同じ state が含まれる。
4. `/contact` で support assist panel に localization ops 行が表示される。
5. fallback locale 時も internal 情報（メモ本文/下書き）が表示されない。

## 11. 未対応（次PR候補）
- translation memory segment 単位の永続化と fuzzy match 監査 UI。
- locale ranking tuning の experiment rollout 管理。
- regional policy template を internal admin で編集/承認する UI。

## 12. 仮定
- support case 作成APIは既存の prefill query param 拡張を許容する。
- analytics ingest は未知メタデータキーを許容する。
- locale は `ja/en/ko` を主対象とし、未知 locale は既存 fallback へ流す。
