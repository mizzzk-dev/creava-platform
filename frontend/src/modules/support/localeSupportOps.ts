import type { GuideItem, SourceSite } from '@/types'

export type LocalizationState = 'not_started' | 'draft' | 'in_translation' | 'review_pending' | 'published' | 'outdated' | 'archived'
export type LocalizationWorkflowState = 'not_started' | 'queued' | 'in_progress' | 'review_pending' | 'published' | 'blocked' | 'outdated'
export type LocalizationVariantState = 'source' | 'translated' | 'fallback_rendered' | 'locale_adapted'
export type TranslationMemoryState = 'none' | 'partial' | 'matched' | 'reused' | 'needs_review'
export type TranslationMemoryMatchState = 'no_match' | 'fuzzy_match' | 'exact_match' | 'conflicting_match'
export type GlossaryState = 'not_defined' | 'draft' | 'active' | 'deprecated'
export type GlossaryConsistencyState = 'consistent' | 'minor_drift' | 'inconsistent' | 'blocked'
export type TranslationQualityState = 'unknown' | 'acceptable' | 'needs_review' | 'risky' | 'blocked'
export type TranslationReviewState = 'not_reviewed' | 'in_review' | 'approved' | 'rejected' | 'superseded'
export type LocaleFallbackState = 'not_needed' | 'source_language_used' | 'fallback_locale_used' | 'blocked_due_to_missing_content'
export type LocaleRetrievalState = 'not_evaluated' | 'healthy' | 'weak' | 'fallback_heavy' | 'review_needed'
export type RetrievalQualityState = 'unknown' | 'acceptable' | 'needs_tuning' | 'risky'
export type LocaleRecommendationState = 'not_evaluated' | 'eligible' | 'shown' | 'clicked' | 'dismissed' | 'suppressed'
export type LocaleRankingState = 'not_ranked' | 'ranked' | 'low_confidence' | 'fallback_applied'
export type RegionalPolicyTemplateState = 'draft' | 'active' | 'under_review' | 'deprecated'
export type RegionalPolicyState = 'inactive' | 'active' | 'under_review' | 'deprecated'
export type LocaleEffectivenessState = 'unknown' | 'healthy' | 'weak' | 'underperforming' | 'review_needed'
export type LocaleSearchState = 'idle' | 'searched' | 'fallback' | 'failed'
export type LocaleSearchResultState = 'results_found' | 'low_confidence' | 'no_results' | 'fallback_results'
export type LocaleSearchFailureState = 'none' | 'no_result' | 'ambiguous' | 'fallback_loop' | 'translation_gap'
export type LocaleTroubleshootingState = 'not_started' | 'guided' | 'completed' | 'fallback_guided' | 'handoff_suggested'
export type LocaleHandoffState = 'not_needed' | 'suggested' | 'accepted' | 'submitted'
export type LocaleCasePrefillState = 'none' | 'prepared' | 'submitted'
export type LocaleFeedbackState = 'none' | 'helpful' | 'not_helpful' | 'translation_issue'
export type LocaleKnowledgeGapState = 'none' | 'suspected' | 'confirmed' | 'article_needed' | 'translation_needed'
export type LocaleCoverageState = 'unknown' | 'covered' | 'partial' | 'missing'

export interface LocaleSupportSummary {
  multilingualSupportSummary: string
  sourceLanguageState: string
  targetLocaleState: string
  localizationState: LocalizationState
  localizationWorkflowState: LocalizationWorkflowState
  localizationVariantState: LocalizationVariantState
  translationMemoryState: TranslationMemoryState
  translationMemoryMatchState: TranslationMemoryMatchState
  glossaryState: GlossaryState
  glossaryConsistencyState: GlossaryConsistencyState
  translationQualityState: TranslationQualityState
  translationReviewState: TranslationReviewState
  localeFallbackState: LocaleFallbackState
  localeRetrievalState: LocaleRetrievalState
  retrievalQualityState: RetrievalQualityState
  localeRecommendationState: LocaleRecommendationState
  localeRankingState: LocaleRankingState
  regionalPolicyTemplateState: RegionalPolicyTemplateState
  regionalPolicyState: RegionalPolicyState
  localeEffectivenessState: LocaleEffectivenessState
  localeSearchState: LocaleSearchState
  localeSearchResultState: LocaleSearchResultState
  localeSearchFailureState: LocaleSearchFailureState
  localeTroubleshootingState: LocaleTroubleshootingState
  localeHandoffState: LocaleHandoffState
  localeCasePrefillState: LocaleCasePrefillState
  localeFeedbackState: LocaleFeedbackState
  localeKnowledgeGapState: LocaleKnowledgeGapState
  localeCoverageState: LocaleCoverageState
  articleState: 'published' | 'draft' | 'outdated'
  articleVisibilityState: 'public' | 'members_only' | 'support_only' | 'internal_only'
  articleLastLocalizedAt?: string
  articleLastMemoryMatchedAt?: string
  articleLastGlossaryCheckedAt?: string
  articleLastReviewedAt?: string
  localeLastEvaluatedAt: string
}

export function normalizeLocale(input?: string | null): string {
  const raw = String(input ?? 'ja').trim().toLowerCase()
  if (!raw) return 'ja'
  if (raw.startsWith('ja')) return 'ja'
  if (raw.startsWith('en')) return 'en'
  if (raw.startsWith('ko')) return 'ko'
  return raw
}

function fallbackLocale(locale: string): string {
  if (locale === 'ko') return 'en'
  return 'ja'
}

export function getLocaleCoverage(guides: GuideItem[], locale: string): LocaleCoverageState {
  const normalized = normalizeLocale(locale)
  const localizedCount = guides.filter((item) => normalizeLocale(item.locale) === normalized).length
  if (localizedCount === 0) return guides.length > 0 ? 'partial' : 'missing'
  if (localizedCount >= Math.max(1, Math.floor(guides.length * 0.6))) return 'covered'
  return 'partial'
}

export function resolveLocalizedGuides(params: {
  guides: GuideItem[]
  locale: string
  sourceSite: SourceSite
  category: string
}): {
  guides: GuideItem[]
  fallbackState: LocaleFallbackState
  coverageState: LocaleCoverageState
} {
  const normalized = normalizeLocale(params.locale)
  const fallback = fallbackLocale(normalized)
  const scoped = params.guides
    .filter((guide) => guide.sourceSite === 'all' || guide.sourceSite === params.sourceSite)
    .filter((guide) => params.category === 'all' || guide.category === params.category)

  const localized = scoped.filter((guide) => normalizeLocale(guide.locale) === normalized)
  if (localized.length > 0) {
    return {
      guides: localized,
      fallbackState: 'not_needed',
      coverageState: getLocaleCoverage(scoped, normalized),
    }
  }

  const fallbackGuides = scoped.filter((guide) => normalizeLocale(guide.locale) === fallback)
  if (fallbackGuides.length > 0) {
    return {
      guides: fallbackGuides,
      fallbackState: 'fallback_locale_used',
      coverageState: 'partial',
    }
  }

  return {
    guides: scoped,
    fallbackState: scoped.length > 0 ? 'source_language_used' : 'blocked_due_to_missing_content',
    coverageState: scoped.length > 0 ? 'partial' : 'missing',
  }
}

export function buildLocaleSupportSummary(params: {
  locale: string
  sourceSite: SourceSite
  searchResultCount: number
  fallbackState: LocaleFallbackState
  coverageState: LocaleCoverageState
  hasKnownIssue: boolean
}): LocaleSupportSummary {
  const locale = normalizeLocale(params.locale)
  const noResult = params.searchResultCount <= 0
  const lowConfidence = params.searchResultCount > 0 && params.searchResultCount <= 2
  const now = new Date().toISOString()

  return {
    multilingualSupportSummary: `${params.sourceSite}:${locale}:${params.fallbackState}:${params.coverageState}`,
    sourceLanguageState: 'ja',
    targetLocaleState: locale,
    localizationState: params.coverageState === 'missing' ? 'not_started' : params.coverageState === 'partial' ? 'draft' : 'published',
    localizationWorkflowState: params.coverageState === 'missing' ? 'queued' : params.fallbackState === 'not_needed' ? 'published' : 'review_pending',
    localizationVariantState: params.fallbackState === 'not_needed' ? 'translated' : 'fallback_rendered',
    translationMemoryState: params.fallbackState === 'not_needed' ? 'reused' : 'partial',
    translationMemoryMatchState: params.fallbackState === 'not_needed' ? 'exact_match' : 'fuzzy_match',
    glossaryState: 'active',
    glossaryConsistencyState: params.fallbackState === 'not_needed' ? 'consistent' : 'minor_drift',
    translationQualityState: params.fallbackState === 'fallback_locale_used' ? 'needs_review' : 'acceptable',
    translationReviewState: params.fallbackState === 'not_needed' ? 'approved' : 'in_review',
    localeFallbackState: params.fallbackState,
    localeRetrievalState: noResult ? 'review_needed' : lowConfidence ? 'weak' : params.fallbackState === 'not_needed' ? 'healthy' : 'fallback_heavy',
    retrievalQualityState: noResult ? 'risky' : lowConfidence ? 'needs_tuning' : 'acceptable',
    localeRecommendationState: noResult ? 'suppressed' : 'shown',
    localeRankingState: lowConfidence ? 'low_confidence' : 'ranked',
    regionalPolicyTemplateState: 'active',
    regionalPolicyState: 'active',
    localeEffectivenessState: noResult ? 'review_needed' : lowConfidence ? 'weak' : 'healthy',
    localeSearchState: noResult ? 'failed' : params.fallbackState === 'not_needed' ? 'searched' : 'fallback',
    localeSearchResultState: noResult ? 'no_results' : lowConfidence ? 'low_confidence' : params.fallbackState === 'not_needed' ? 'results_found' : 'fallback_results',
    localeSearchFailureState: noResult ? 'no_result' : params.fallbackState === 'fallback_locale_used' ? 'translation_gap' : 'none',
    localeTroubleshootingState: noResult ? 'handoff_suggested' : 'guided',
    localeHandoffState: noResult ? 'suggested' : 'not_needed',
    localeCasePrefillState: noResult || lowConfidence ? 'prepared' : 'none',
    localeFeedbackState: 'none',
    localeKnowledgeGapState: noResult && !params.hasKnownIssue ? 'translation_needed' : 'none',
    localeCoverageState: params.coverageState,
    articleState: 'published',
    articleVisibilityState: 'public',
    articleLastLocalizedAt: now,
    articleLastMemoryMatchedAt: now,
    articleLastGlossaryCheckedAt: now,
    articleLastReviewedAt: now,
    localeLastEvaluatedAt: now,
  }
}
