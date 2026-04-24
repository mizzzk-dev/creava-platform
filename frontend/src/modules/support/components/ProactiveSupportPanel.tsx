import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { SourceSite } from '@/types'
import { trackMizzzEvent } from '@/modules/analytics/tracking'
import type { HelpKnowledgeCandidate } from '@/modules/support/conversationalHelp'
import {
  buildProactiveRecommendations,
  evaluateProactiveSupport,
  type ProactiveSupportSummary,
} from '@/modules/support/proactiveSupport'
import {
  rankProactiveRecommendations,
  type ProactiveOptimizationSummary,
} from '@/modules/support/proactiveOptimization'

const PROACTIVE_SUPPORT_ENABLED = String(import.meta.env.VITE_PROACTIVE_SUPPORT_ENABLED ?? 'true').toLowerCase() !== 'false'
const PROACTIVE_SUPPORT_MIN_SCORE = Number(import.meta.env.VITE_PROACTIVE_SUPPORT_MIN_SCORE ?? 40)

interface Props {
  sourceSite: SourceSite
  category: string
  search: string
  candidates: HelpKnowledgeCandidate[]
  inquiryPath: string
  isSignedIn: boolean
  membershipStatus?: string
  lifecycleStage?: string
  onSummaryChanged?: (summary: ProactiveSupportSummary) => void
  onOptimizationChanged?: (summary: ProactiveOptimizationSummary) => void
}

export default function ProactiveSupportPanel({
  sourceSite,
  category,
  search,
  candidates,
  inquiryPath,
  isSignedIn,
  membershipStatus,
  lifecycleStage,
  onSummaryChanged,
  onOptimizationChanged,
}: Props) {
  const { t } = useTranslation()

  const summary = useMemo(() => evaluateProactiveSupport({
    sourceSite,
    category,
    search,
    faqs: [],
    guides: [],
    candidates,
    statusSummary: null,
    isSignedIn,
    membershipStatus,
    lifecycleStage,
  }), [category, candidates, isSignedIn, lifecycleStage, membershipStatus, search, sourceSite])

  const recommendations = useMemo(() => buildProactiveRecommendations({
    sourceSite,
    summary,
    candidates,
    category,
    inquiryPath,
  }), [category, candidates, inquiryPath, sourceSite, summary])

  const rankedResult = useMemo(() => rankProactiveRecommendations({
    sourceSite,
    category,
    summary,
    candidates,
    recommendations,
  }), [category, candidates, recommendations, sourceSite, summary])

  useEffect(() => {
    onSummaryChanged?.(summary)
    onOptimizationChanged?.(rankedResult.optimization)
  }, [onOptimizationChanged, onSummaryChanged, rankedResult.optimization, summary])

  useEffect(() => {
    if (rankedResult.ranked.length === 0) return
    trackMizzzEvent('proactive_intervention_shown', {
      sourceSite: sourceSite === 'all' ? 'main' : sourceSite,
      supportCaseType: category === 'all' ? 'general' : category,
      rankingState: rankedResult.optimization.rankingState,
      orchestrationState: rankedResult.optimization.orchestrationState,
      experimentState: rankedResult.optimization.experimentState,
    })
  }, [category, rankedResult.optimization.experimentState, rankedResult.optimization.orchestrationState, rankedResult.optimization.rankingState, rankedResult.ranked.length, sourceSite])

  if (!PROACTIVE_SUPPORT_ENABLED) return null
  if (summary.recommendationState === 'suppressed') return null
  const scoreMap = { low: 10, medium: 60, high: 90 } as const
  if (scoreMap[summary.recommendationScoreState] < PROACTIVE_SUPPORT_MIN_SCORE) return null
  if (rankedResult.ranked.length === 0) return null

  return (
    <section className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900/60 dark:bg-violet-950/20">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-300">{t('support.proactive.title')}</p>
        <span className="rounded-full border border-violet-300 px-2 py-0.5 text-[11px] text-violet-700 dark:border-violet-800 dark:text-violet-200">
          {summary.recommendationScoreState} / {summary.issueSignalState}
        </span>
        <span className="rounded-full border border-cyan-300 px-2 py-0.5 text-[11px] text-cyan-700 dark:border-cyan-800 dark:text-cyan-200">
          {rankedResult.optimization.rankingState} / {rankedResult.optimization.orchestrationPolicyState}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{summary.proactiveSupportSummary}</p>

      <ul className="mt-3 space-y-2">
        {rankedResult.ranked.map((recommendation) => {
          const isHash = recommendation.ctaTo.startsWith('#')
          const onClick = () => {
            trackMizzzEvent('proactive_intervention_click', {
              sourceSite: sourceSite === 'all' ? 'main' : sourceSite,
              supportCaseType: category === 'all' ? 'general' : category,
              recommendationType: recommendation.recommendationType,
              recommendationScoreState: recommendation.recommendationScoreState,
              issueSignalState: summary.issueSignalState,
              rankingReason: rankedResult.optimization.rankingReason,
              experimentVariantState: rankedResult.optimization.experimentVariantState,
            })
            onSummaryChanged?.({ ...summary, interventionState: 'engaged', recommendationState: 'clicked', recommendationLastClickedAt: new Date().toISOString() })
          }

          return (
            <li key={recommendation.id} className="rounded-xl border border-violet-100 bg-white/80 p-3 dark:border-violet-900/50 dark:bg-gray-950/50">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{recommendation.title}</p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{recommendation.description}</p>
              {isHash ? (
                <a href={recommendation.ctaTo} className="mt-2 inline-flex text-xs text-violet-700 underline dark:text-violet-300" onClick={onClick}>
                  {recommendation.ctaLabel}
                </a>
              ) : (
                <Link to={recommendation.ctaTo} className="mt-2 inline-flex text-xs text-violet-700 underline dark:text-violet-300" onClick={onClick}>
                  {recommendation.ctaLabel}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
