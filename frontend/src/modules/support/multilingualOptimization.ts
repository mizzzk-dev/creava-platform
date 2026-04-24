import type { SourceSite } from '@/types'
import type {
  GlossaryConsistencyState,
  GlossaryState,
  LocaleCasePrefillState,
  LocaleCoverageState,
  LocaleEffectivenessState,
  LocaleFallbackState,
  LocaleFeedbackState,
  LocaleHandoffState,
  LocaleKnowledgeGapState,
  LocaleRankingState,
  LocaleRecommendationState,
  LocaleRetrievalState,
  LocalizationState,
  LocalizationWorkflowState,
  RegionalPolicyState,
  RegionalPolicyTemplateState,
  RetrievalQualityState,
  TranslationMemoryMatchState,
  TranslationMemoryState,
  TranslationQualityState,
  TranslationReviewState,
} from '@/modules/support/localeSupportOps'

export interface MultilingualOptimizationSummary {
  multilingualOptimizationSummary: string
  sourceSite: SourceSite
  sourceLanguageState: string
  targetLocaleState: string
  localizationState: LocalizationState
  localizationWorkflowState: LocalizationWorkflowState
  translationMemoryState: TranslationMemoryState
  translationMemoryMatchState: TranslationMemoryMatchState
  glossaryState: GlossaryState
  glossaryConsistencyState: GlossaryConsistencyState
  translationQualityState: TranslationQualityState
  translationReviewState: TranslationReviewState
  localeFallbackState: LocaleFallbackState
  localeRetrievalState: LocaleRetrievalState
  retrievalQualityState: RetrievalQualityState
  localeRankingState: LocaleRankingState
  localeRecommendationState: LocaleRecommendationState
  regionalPolicyTemplateState: RegionalPolicyTemplateState
  regionalPolicyState: RegionalPolicyState
  localeEffectivenessState: LocaleEffectivenessState
  localeCoverageState: LocaleCoverageState
  localeHandoffState: LocaleHandoffState
  localeCasePrefillState: LocaleCasePrefillState
  localeFeedbackState: LocaleFeedbackState
  localeKnowledgeGapState: LocaleKnowledgeGapState
  articleLastLocalizedAt?: string
  articleLastMemoryMatchedAt?: string
  articleLastGlossaryCheckedAt?: string
  localeLastEvaluatedAt: string
}

export function buildMultilingualOptimizationSummary(params: {
  sourceSite: SourceSite
  localeSummary: {
    sourceLanguageState: string
    targetLocaleState: string
    localizationState: LocalizationState
    localizationWorkflowState: LocalizationWorkflowState
    translationMemoryState: TranslationMemoryState
    translationMemoryMatchState: TranslationMemoryMatchState
    glossaryState: GlossaryState
    glossaryConsistencyState: GlossaryConsistencyState
    translationQualityState: TranslationQualityState
    translationReviewState: TranslationReviewState
    localeFallbackState: LocaleFallbackState
    localeRetrievalState: LocaleRetrievalState
    retrievalQualityState: RetrievalQualityState
    localeRankingState: LocaleRankingState
    localeRecommendationState: LocaleRecommendationState
    regionalPolicyTemplateState: RegionalPolicyTemplateState
    regionalPolicyState: RegionalPolicyState
    localeEffectivenessState: LocaleEffectivenessState
    localeCoverageState: LocaleCoverageState
    localeHandoffState: LocaleHandoffState
    localeCasePrefillState: LocaleCasePrefillState
    localeFeedbackState: LocaleFeedbackState
    localeKnowledgeGapState: LocaleKnowledgeGapState
    articleLastLocalizedAt?: string
    articleLastMemoryMatchedAt?: string
    articleLastGlossaryCheckedAt?: string
    localeLastEvaluatedAt: string
  }
}): MultilingualOptimizationSummary {
  const summary = params.localeSummary
  return {
    multilingualOptimizationSummary: `${params.sourceSite}:${summary.targetLocaleState}:${summary.translationMemoryState}:${summary.localeRetrievalState}:${summary.regionalPolicyTemplateState}`,
    sourceSite: params.sourceSite,
    sourceLanguageState: summary.sourceLanguageState,
    targetLocaleState: summary.targetLocaleState,
    localizationState: summary.localizationState,
    localizationWorkflowState: summary.localizationWorkflowState,
    translationMemoryState: summary.translationMemoryState,
    translationMemoryMatchState: summary.translationMemoryMatchState,
    glossaryState: summary.glossaryState,
    glossaryConsistencyState: summary.glossaryConsistencyState,
    translationQualityState: summary.translationQualityState,
    translationReviewState: summary.translationReviewState,
    localeFallbackState: summary.localeFallbackState,
    localeRetrievalState: summary.localeRetrievalState,
    retrievalQualityState: summary.retrievalQualityState,
    localeRankingState: summary.localeRankingState,
    localeRecommendationState: summary.localeRecommendationState,
    regionalPolicyTemplateState: summary.regionalPolicyTemplateState,
    regionalPolicyState: summary.regionalPolicyState,
    localeEffectivenessState: summary.localeEffectivenessState,
    localeCoverageState: summary.localeCoverageState,
    localeHandoffState: summary.localeHandoffState,
    localeCasePrefillState: summary.localeCasePrefillState,
    localeFeedbackState: summary.localeFeedbackState,
    localeKnowledgeGapState: summary.localeKnowledgeGapState,
    articleLastLocalizedAt: summary.articleLastLocalizedAt,
    articleLastMemoryMatchedAt: summary.articleLastMemoryMatchedAt,
    articleLastGlossaryCheckedAt: summary.articleLastGlossaryCheckedAt,
    localeLastEvaluatedAt: summary.localeLastEvaluatedAt,
  }
}
