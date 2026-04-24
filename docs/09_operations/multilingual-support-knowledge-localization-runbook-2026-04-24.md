# multilingual support knowledge / localization / translation QA / locale-aware orchestration runbook（2026-04-24）

## 1. 目的
- 対象: `mizzz.jp`（main）/ `store.mizzz.jp`（store）/ `fc.mizzz.jp`（fc）。
- 目的: 既存の help center / conversational help / proactive support を、言語別に一貫運用できる基盤へ拡張する。
- 重点: article 原文管理・localization・translation QA・locale-aware retrieval・handoff・case prefill・effectiveness 計測を分離する。

## 2. 現在の弱点（調査サマリ）
1. locale fallback は暗黙で、言語ごとの coverage や translation quality が support 画面で見えにくい。
2. article の公開状態と localization 運用状態が同一視されやすく、運用判断が難しい。
3. locale 別の no-result / low-confidence / fallback 発生を同じ軸で比較しづらい。
4. assistant handoff prefill へ locale 文脈が不足し、support 側で再ヒアリングが発生しやすい。
5. locale effectiveness（検索成功・fallback 発生・handoff 比率）を operations 側で追うための共通 summary が不足していた。

## 3. 責務分離（必須 state）
### article / localization / translation
- `articleState`: article 自体（draft/published/outdated）。
- `localizationState`: 翻訳運用（not_started/draft/in_translation/review_pending/published/outdated/archived）。
- `translationQualityState`: 品質評価（unknown/acceptable/needs_review/risky/blocked）。
- `translationReviewState`: レビュー工程（not_reviewed/in_review/approved/rejected/superseded）。

### retrieval / recommendation / policy
- `localeFallbackState`: 表示言語の fallback 結果。
- `localeRecommendationState`: locale別に recommendation が出せたか。
- `localeRankingState`: locale-aware ranking 評価状態。
- `regionalPolicyState`: 地域ポリシーの適用状態。

### effectiveness / handoff
- `localeEffectivenessState`: 言語別の解決寄与評価。
- `localeSearchResultState`: results_found / low_confidence / no_results / fallback_results。
- `localeSearchFailureState`: no_result / translation_gap など。
- `localeHandoffState` と `localeCasePrefillState`: handoff 提案と case 作成を分離。

## 4. 実装構成（今回の追加）
- `frontend/src/modules/support/localeSupportOps.ts`
  - locale 正規化、fallback 判定、coverage 判定、locale summary 生成を集約。
  - localization / translation QA / locale recommendation / regional policy / locale effectiveness の state を型で定義。
- `frontend/src/pages/support/SupportCenterPage.tsx`
  - locale-aware guide 解決を導入（対象 locale が不足時に fallback）。
  - `locale_support_summary_logged` で locale summary を計測。
  - fallback 表示時にユーザーへ明示メッセージを表示。
- `frontend/src/modules/support/components/ConversationalHelpAssistant.tsx`
  - handoff prefill に locale / fallback / translation quality を carry-over。
  - assistant UI に locale state を表示。

## 5. locale-aware help / handoff 運用
1. `/support` を開く。
2. locale が `ja/en/ko` 以外でも正規化され、fallback ルールで guide 候補を返す。
3. fallback が発生した場合、画面上に fallback notice が表示される。
4. conversational help から handoff すると、問い合わせ prefill に locale context が含まれる。

## 6. analytics / effectiveness 監視ポイント
- `locale_support_summary_logged` を起点に以下を確認。
  - `targetLocaleState`
  - `localeFallbackState`
  - `localeCoverageState`
  - `localeSearchResultState`
  - `localeEffectivenessState`
  - `localeKnowledgeGapState`
- no-result / low-confidence の増加時は、translation quality と locale coverage の更新を優先する。

## 7. セキュリティ方針
- localization draft / translation review note / internal note は user-facing に出さない。
- support-only / internal-only visibility を維持し、public article と混在させない。
- handoff prefill には internal note を含めない。

## 8. 環境変数
- `VITE_SUPPORT_LOCALE_DEFAULT`: support の既定 locale。
- `VITE_SUPPORT_LOCALE_FALLBACK_CHAIN`: fallback 優先順。
- `VITE_SUPPORT_LOCALE_MIN_COVERAGE`: coverage 判定閾値。
- `VITE_SUPPORT_TRANSLATION_QA_ENABLED`: translation QA 表示/運用フラグ。
- `VITE_SUPPORT_LOCALE_ANALYTICS_ENABLED`: locale analytics 送信フラグ。

## 9. テスト手順
1. locale を `ja` で `/support` 表示し、guide / faq が出ること。
2. locale を `ko` に切り替え、対象記事不足時に fallback notice が出ること。
3. conversational help で handoff を押下し、問い合わせ URL に locale 状態が含まれること。
4. analytics payload に `locale_support_summary_logged` が送られること。

## 10. 既知の未対応（次PR候補）
- locale-specific semantic retrieval のスコア最適化。
- translation memory / 用語集ベースの QA 自動提案。
- regional policy template の運用 UI。
- operations dashboard で locale effectiveness カードを正式表示。

## 11. 仮定
- FAQ は現状 locale フィールドを持たないため、guide locale を先に適用する前提。
- locale 判定は `document.documentElement.lang` を一次情報として扱う前提。
- 既存の support case / thread / prefill 基盤が有効である前提。
