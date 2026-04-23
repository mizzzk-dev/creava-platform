import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { FAQItem, GuideItem, SourceSite } from '@/types'
import type { PublicStatusResponse } from '@/modules/status/api'
import { ROUTES } from '@/lib/routeConstants'
import { trackMizzzEvent } from '@/modules/analytics/tracking'
import {
  buildCasePrefill,
  buildTroubleshootingSteps,
  detectAssistantIntent,
  resolveSemanticRetrievalState,
  retrieveKnowledgeCandidates,
  type ConversationalHelpSummary,
} from '@/modules/support/conversationalHelp'

const ASSISTANT_MIN_QUERY_LENGTH = Number(import.meta.env.VITE_HELP_ASSISTANT_MIN_QUERY_LENGTH ?? 4)
const ASSISTANT_MAX_CANDIDATES = Number(import.meta.env.VITE_HELP_ASSISTANT_MAX_CANDIDATES ?? 3)

const toSearchResultState = (state: 'not_run' | 'results_found' | 'low_confidence' | 'no_results' | 'ambiguous'): 'none' | 'results_found' | 'low_confidence' | 'no_results' | 'ambiguous' => (
  state === 'not_run' ? 'none' : state
)

interface Props {
  sourceSite: SourceSite
  category: string
  search: string
  faqs: FAQItem[]
  guides: GuideItem[]
  statusSummary: PublicStatusResponse | null
}

const resolveInitialSummary = (query: string): ConversationalHelpSummary => ({
  helpAssistantSummary: '',
  assistantSessionState: 'idle',
  assistantTurnState: 'listening',
  assistantIntentState: 'unknown',
  semanticRetrievalState: 'not_run',
  retrievalConfidenceState: 'low',
  troubleshootingState: 'not_started',
  troubleshootingStepState: 'none',
  troubleshootingOutcomeState: 'unknown',
  handoffState: 'not_needed',
  handoffReason: '',
  casePrefillState: 'none',
  conversationEffectivenessState: 'unknown',
  articleSuggestionState: 'none',
  knownIssueSuggestionState: 'none',
  assistantFeedbackState: 'none',
  assistantFeedbackScoreState: 'unrated',
  searchState: query.trim() ? 'typing' : 'idle',
  searchQueryState: query,
  searchResultState: 'none',
  knowledgeGapState: 'none',
  articleEffectivenessState: 'unknown',
})

export default function ConversationalHelpAssistant({ sourceSite, category, search, faqs, guides, statusSummary }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState(search)
  const [summary, setSummary] = useState<ConversationalHelpSummary>(() => resolveInitialSummary(search))
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const candidates = useMemo(() => retrieveKnowledgeCandidates({
    query,
    sourceSite,
    category,
    faqs,
    guides,
    statusSummary,
  }).slice(0, ASSISTANT_MAX_CANDIDATES), [category, faqs, guides, query, sourceSite, statusSummary])

  const retrieval = useMemo(() => resolveSemanticRetrievalState(candidates), [candidates])
  const intent = useMemo(() => detectAssistantIntent(query), [query])
  const troubleshootingSteps = useMemo(() => buildTroubleshootingSteps(intent), [intent])

  const casePrefill = useMemo(() => buildCasePrefill({
    sourceSite,
    category: category === 'all' ? 'general' : category,
    query,
    summary,
    candidates,
    attemptedSteps: completedSteps.map((idx) => troubleshootingSteps[idx]).filter(Boolean),
  }), [candidates, category, completedSteps, query, sourceSite, summary, troubleshootingSteps])

  const handoffUrl = useMemo(() => {
    const params = new URLSearchParams({
      tab: sourceSite === 'store' ? 'store_support' : sourceSite === 'fc' ? 'fc_support' : 'contact',
      prefill_subject: casePrefill.subject,
      prefill_message: casePrefill.message,
      prefill_category: category === 'all' ? 'general' : category,
      assistant_session_state: summary.assistantSessionState,
      semantic_retrieval_state: retrieval.semanticRetrievalState,
      retrieval_confidence_state: retrieval.retrievalConfidenceState,
    })
    return `${ROUTES.CONTACT}?${params.toString()}`
  }, [casePrefill.message, casePrefill.subject, category, retrieval.retrievalConfidenceState, retrieval.semanticRetrievalState, sourceSite, summary.assistantSessionState])

  const runAssistant = () => {
    if (query.trim().length < ASSISTANT_MIN_QUERY_LENGTH) return
    const nextSummary: ConversationalHelpSummary = {
      ...summary,
      helpAssistantSummary: query.trim(),
      assistantSessionState: 'active',
      assistantTurnState: 'guiding',
      assistantIntentState: intent,
      semanticRetrievalState: retrieval.semanticRetrievalState,
      retrievalConfidenceState: retrieval.retrievalConfidenceState,
      troubleshootingState: 'guided',
      troubleshootingStepState: 'suggested',
      handoffState: retrieval.semanticRetrievalState === 'no_results' ? 'suggested' : 'not_needed',
      handoffReason: retrieval.semanticRetrievalState === 'no_results' ? 'no_results' : '',
      casePrefillState: 'partial',
      articleSuggestionState: candidates.length > 0 ? 'suggested' : 'none',
      knownIssueSuggestionState: candidates.some((item) => item.type === 'known_issue') ? 'suggested' : 'none',
      searchState: 'searched',
      searchQueryState: query,
      searchResultState: toSearchResultState(retrieval.semanticRetrievalState),
      assistantLastRetrievedAt: new Date().toISOString(),
      assistantLastSuggestedAt: new Date().toISOString(),
    }
    setSummary(nextSummary)
    trackMizzzEvent('assistant_session_start', {
      sourceSite,
      supportCaseType: category === 'all' ? 'general' : category,
      assistantSessionState: nextSummary.assistantSessionState,
      assistantIntentState: nextSummary.assistantIntentState,
      semanticRetrievalState: nextSummary.semanticRetrievalState,
      retrievalConfidenceState: nextSummary.retrievalConfidenceState,
    })
  }

  return (
    <section className="mt-8 rounded-2xl border border-cyan-200 bg-cyan-50/30 p-5 dark:border-cyan-900 dark:bg-cyan-950/20">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('support.assistant.title')}</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('support.assistant.description')}</p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('support.assistant.placeholder')}
          className="w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-800 dark:bg-gray-900 dark:text-gray-100"
        />
        <button type="button" onClick={runAssistant} className="rounded-xl border border-cyan-400 px-3 py-2 text-xs text-cyan-800 dark:border-cyan-700 dark:text-cyan-200">
          {t('support.assistant.run')}
        </button>
      </div>
      {query.trim().length > 0 && query.trim().length < ASSISTANT_MIN_QUERY_LENGTH && (
        <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">{t('support.assistant.minQueryHint', { count: ASSISTANT_MIN_QUERY_LENGTH })}</p>
      )}

      {summary.assistantSessionState !== 'idle' && (
        <div className="mt-4 space-y-3 text-xs text-gray-600 dark:text-gray-300">
          <p>{t('support.assistant.stateLabel')}: {summary.assistantSessionState} / {summary.semanticRetrievalState} ({summary.retrievalConfidenceState})</p>

          <ul className="space-y-2">
            {candidates.map((candidate) => (
              <li key={candidate.id} className="rounded-xl border border-cyan-100 bg-white/80 p-3 dark:border-cyan-900/70 dark:bg-gray-950/50">
                <Link
                  to={candidate.slug}
                  className="font-semibold text-cyan-700 underline dark:text-cyan-300"
                  onClick={() => {
                    trackMizzzEvent('assistant_article_suggestion_click', {
                      sourceSite,
                      supportCaseType: category === 'all' ? 'general' : category,
                      articleType: candidate.type,
                      semanticRetrievalState: summary.semanticRetrievalState,
                    })
                    setSummary((prev) => ({ ...prev, articleSuggestionState: 'opened' }))
                  }}
                >
                  {candidate.title}
                </Link>
                <p className="mt-1">{candidate.summary}</p>
              </li>
            ))}
            {candidates.length === 0 && <li className="text-amber-700 dark:text-amber-300">{t('support.assistant.noCandidates')}</li>}
          </ul>

          <div className="rounded-xl border border-cyan-100 bg-white/70 p-3 dark:border-cyan-900/60 dark:bg-gray-950/40">
            <p className="font-semibold">{t('support.assistant.troubleshooting')}</p>
            <ul className="mt-2 space-y-1">
              {troubleshootingSteps.map((step, index) => (
                <li key={`${step}-${index}`} className="flex items-center justify-between gap-2">
                  <span>{index + 1}. {step}</span>
                  <button
                    type="button"
                    className="rounded-full border border-cyan-300 px-2 py-0.5 text-[11px] dark:border-cyan-700"
                    onClick={() => {
                      setCompletedSteps((prev) => (prev.includes(index) ? prev : [...prev, index]))
                      setSummary((prev) => ({
                        ...prev,
                        troubleshootingState: 'guided',
                        troubleshootingStepState: 'completed',
                        troubleshootingOutcomeState: 'partial',
                      }))
                      trackMizzzEvent('assistant_troubleshooting_step_complete', {
                        sourceSite,
                        supportCaseType: category === 'all' ? 'general' : category,
                        stepIndex: index + 1,
                        assistantIntentState: intent,
                      })
                    }}
                  >
                    {completedSteps.includes(index) ? t('support.assistant.completed') : t('support.assistant.markDone')}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-emerald-300 px-3 py-1 text-[11px] text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
              onClick={() => {
                setSummary((prev) => ({
                  ...prev,
                  assistantSessionState: 'completed',
                  troubleshootingState: 'self_resolved',
                  conversationEffectivenessState: 'self_resolved',
                  assistantFeedbackState: 'positive',
                  assistantFeedbackScoreState: '5',
                }))
                trackMizzzEvent('assistant_feedback_submit', {
                  sourceSite,
                  supportCaseType: category === 'all' ? 'general' : category,
                  assistantFeedbackState: 'positive',
                  assistantFeedbackScoreState: '5',
                })
              }}
            >
              {t('support.assistant.resolved')}
            </button>
            <Link
              to={handoffUrl}
              className="rounded-full border border-violet-300 px-3 py-1 text-[11px] text-violet-700 dark:border-violet-700 dark:text-violet-300"
              onClick={() => {
                setSummary((prev) => ({
                  ...prev,
                  handoffState: 'preparing',
                  casePrefillState: 'prepared',
                  assistantSessionState: 'handing_off',
                  assistantLastHandedOffAt: new Date().toISOString(),
                }))
                trackMizzzEvent('assistant_handoff_accept', {
                  sourceSite,
                  supportCaseType: category === 'all' ? 'general' : category,
                  handoffState: 'preparing',
                  semanticRetrievalState: summary.semanticRetrievalState,
                })
              }}
            >
              {t('support.assistant.handoff')}
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
