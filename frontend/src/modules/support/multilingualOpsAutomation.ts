import type { MultilingualOptimizationSummary } from '@/modules/support/multilingualOptimization'

export type TranslationReuseCoverageState = 'unknown' | 'low' | 'moderate' | 'high'
export type LocalizationWorkflowAutomationState = 'manual' | 'assisted' | 'queued' | 'blocked'
export type LocaleRankingTuningState = 'not_started' | 'baseline' | 'tuning_needed' | 'experimenting'
export type RegionalPolicyTemplateCoverageState = 'missing' | 'partial' | 'covered'

export interface MultilingualOpsAutomationSummary {
  translationReuseCoverageState: TranslationReuseCoverageState
  localizationWorkflowAutomationState: LocalizationWorkflowAutomationState
  localeRankingTuningState: LocaleRankingTuningState
  regionalPolicyTemplateCoverageState: RegionalPolicyTemplateCoverageState
  retrievalQualityState: MultilingualOptimizationSummary['retrievalQualityState']
  localeEffectivenessState: MultilingualOptimizationSummary['localeEffectivenessState']
}

export function buildMultilingualOpsAutomationSummary(summary: MultilingualOptimizationSummary): MultilingualOpsAutomationSummary {
  const translationReuseCoverageState: TranslationReuseCoverageState = summary.translationMemoryState === 'reused'
    ? 'high'
    : summary.translationMemoryState === 'matched'
      ? 'moderate'
      : summary.translationMemoryState === 'partial'
        ? 'low'
        : 'unknown'

  const localizationWorkflowAutomationState: LocalizationWorkflowAutomationState = summary.localizationWorkflowState === 'published'
    ? 'assisted'
    : summary.localizationWorkflowState === 'queued' || summary.localizationWorkflowState === 'review_pending'
      ? 'queued'
      : summary.localizationWorkflowState === 'blocked'
        ? 'blocked'
        : 'manual'

  const localeRankingTuningState: LocaleRankingTuningState = summary.retrievalQualityState === 'needs_tuning' || summary.localeRetrievalState === 'weak'
    ? 'tuning_needed'
    : summary.retrievalQualityState === 'risky' || summary.localeRankingState === 'low_confidence'
      ? 'experimenting'
      : summary.localeRankingState === 'ranked'
        ? 'baseline'
        : 'not_started'

  const regionalPolicyTemplateCoverageState: RegionalPolicyTemplateCoverageState = summary.regionalPolicyTemplateState === 'active'
    ? 'covered'
    : summary.regionalPolicyTemplateState === 'under_review'
      ? 'partial'
      : 'missing'

  return {
    translationReuseCoverageState,
    localizationWorkflowAutomationState,
    localeRankingTuningState,
    regionalPolicyTemplateCoverageState,
    retrievalQualityState: summary.retrievalQualityState,
    localeEffectivenessState: summary.localeEffectivenessState,
  }
}

export function buildMultilingualOpsQueryParams(summary: MultilingualOpsAutomationSummary): Record<string, string> {
  return {
    translation_reuse_coverage_state: summary.translationReuseCoverageState,
    localization_workflow_automation_state: summary.localizationWorkflowAutomationState,
    locale_ranking_tuning_state: summary.localeRankingTuningState,
    regional_policy_template_coverage_state: summary.regionalPolicyTemplateCoverageState,
    locale_effectiveness_state: summary.localeEffectivenessState,
  }
}
