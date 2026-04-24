import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStrapiCollection } from '@/hooks'
import { getFaqList } from '@/modules/faq/api'
import { getGuideList } from '@/modules/faq/guideApi'
import type { FAQItem, GuideItem } from '@/types'
import type { FormDefinition } from '@/modules/contact/lib/formDefinitions'
import { ROUTES } from '@/lib/routeConstants'

interface Props {
  formDefinition?: FormDefinition
  handoffContext?: {
    assistantSessionState?: string
    semanticRetrievalState?: string
    retrievalConfidenceState?: string
    proactiveRecommendationState?: string
    proactiveIssueSignalState?: string
    proactiveInterventionState?: string
    proactivePreventionOutcomeState?: string
    rankingState?: string
    rankingReason?: string
    candidateSetState?: string
    orchestrationState?: string
    orchestrationPolicyState?: string
    lifecycleAwareState?: string
    experimentState?: string
    experimentVariantState?: string
    policyState?: string
    policyEffectivenessState?: string
    policyDraftState?: string
    policyReviewState?: string
    policyApprovalState?: string
    policyActivationState?: string
    experimentGuardrailState?: string
    guardrailState?: string
    guardrailReason?: string
    multilingualSafetyState?: string
    multilingualSafetyReviewState?: string
    rollbackState?: string
    rollbackReason?: string
    rollbackPreparednessState?: string
    auditState?: string
    auditTrailState?: string
    auditVisibilityState?: string
    localeImpactState?: string
    changeRiskState?: string
    translationReuseCoverageState?: string
    localizationWorkflowAutomationState?: string
    localeRankingTuningState?: string
    regionalPolicyTemplateCoverageState?: string
  }
}

export default function SupportAssistPanel({ formDefinition, handoffContext }: Props) {
  const { t } = useTranslation()
  const { items: faqs } = useStrapiCollection<FAQItem>(() => getFaqList())
  const { items: guides } = useStrapiCollection<GuideItem>(() => getGuideList())

  const formType = formDefinition?.formType ?? ''
  const sourceSite = formDefinition?.sourceSite ?? 'all'

  const relatedFaqs = (faqs ?? []).filter((item) => {
    if (item.isPublic === false) return false
    const siteMatched = item.sourceSite === 'all' || item.sourceSite === sourceSite
    const formMatched = !formType || !item.relatedForms || item.relatedForms.length === 0 || item.relatedForms.includes(formType)
    return siteMatched && formMatched
  }).slice(0, 3)

  const relatedGuides = (guides ?? []).filter((item) => {
    const siteMatched = item.sourceSite === 'all' || item.sourceSite === sourceSite
    const formMatched = !formType || !item.relatedForms || item.relatedForms.length === 0 || item.relatedForms.includes(formType)
    return siteMatched && formMatched
  }).slice(0, 3)

  if (relatedFaqs.length === 0 && relatedGuides.length === 0) return null

  return (
    <aside className="mt-6 rounded-xl border border-cyan-800/40 bg-cyan-950/20 p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">{t('support.beforeContactTitle')}</p>
      <p className="mt-1 text-xs text-gray-400">{t('support.preFormDescription')}</p>
      {(handoffContext?.assistantSessionState || handoffContext?.semanticRetrievalState) && (
        <p className="mt-2 rounded-md border border-cyan-900/50 bg-cyan-950/40 px-2 py-1 text-[11px] text-cyan-100">
          assistant: {handoffContext.assistantSessionState ?? '-'} / retrieval: {handoffContext.semanticRetrievalState ?? '-'} ({handoffContext.retrievalConfidenceState ?? '-'})
        </p>
      )}
      {(handoffContext?.proactiveRecommendationState || handoffContext?.proactiveIssueSignalState) && (
        <p className="mt-2 rounded-md border border-violet-900/50 bg-violet-950/40 px-2 py-1 text-[11px] text-violet-100">
          proactive: {handoffContext.proactiveRecommendationState ?? '-'} / issue: {handoffContext.proactiveIssueSignalState ?? '-'} / intervention: {handoffContext.proactiveInterventionState ?? '-'} / outcome: {handoffContext.proactivePreventionOutcomeState ?? '-'}
        </p>
      )}
      {(handoffContext?.rankingState || handoffContext?.orchestrationState) && (
        <p className="mt-2 rounded-md border border-emerald-900/50 bg-emerald-950/40 px-2 py-1 text-[11px] text-emerald-100">
          ranking: {handoffContext.rankingState ?? '-'} ({handoffContext.rankingReason ?? '-'}) / candidate: {handoffContext.candidateSetState ?? '-'} / orchestration: {handoffContext.orchestrationState ?? '-'} ({handoffContext.orchestrationPolicyState ?? '-'})
        </p>
      )}
      {(handoffContext?.experimentState || handoffContext?.policyState) && (
        <p className="mt-2 rounded-md border border-amber-900/50 bg-amber-950/40 px-2 py-1 text-[11px] text-amber-100">
          lifecycle: {handoffContext.lifecycleAwareState ?? '-'} / experiment: {handoffContext.experimentState ?? '-'} ({handoffContext.experimentVariantState ?? '-'}) / policy: {handoffContext.policyState ?? '-'} ({handoffContext.policyEffectivenessState ?? '-'})
        </p>
      )}
      {(handoffContext?.guardrailState || handoffContext?.rollbackState || handoffContext?.multilingualSafetyState) && (
        <p className="mt-2 rounded-md border border-rose-900/50 bg-rose-950/40 px-2 py-1 text-[11px] text-rose-100">
          governance: review={handoffContext.policyReviewState ?? '-'} / guardrail={handoffContext.guardrailState ?? '-'} / multilingualSafety={handoffContext.multilingualSafetyState ?? '-'} / rollback={handoffContext.rollbackState ?? '-'}
        </p>
      )}
      {(handoffContext?.auditState || handoffContext?.changeRiskState) && (
        <p className="mt-2 rounded-md border border-slate-700/60 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-100">
          audit={handoffContext.auditState ?? '-'} ({handoffContext.auditTrailState ?? '-'}) / visibility={handoffContext.auditVisibilityState ?? '-'} / localeImpact={handoffContext.localeImpactState ?? '-'} / risk={handoffContext.changeRiskState ?? '-'}
        </p>
      )}
      {(handoffContext?.translationReuseCoverageState || handoffContext?.localizationWorkflowAutomationState || handoffContext?.localeRankingTuningState) && (
        <p className="mt-2 rounded-md border border-indigo-900/50 bg-indigo-950/40 px-2 py-1 text-[11px] text-indigo-100">
          localization ops: reuse={handoffContext.translationReuseCoverageState ?? '-'} / workflow={handoffContext.localizationWorkflowAutomationState ?? '-'} / ranking={handoffContext.localeRankingTuningState ?? '-'} / policyCoverage={handoffContext.regionalPolicyTemplateCoverageState ?? '-'}
        </p>
      )}

      {relatedFaqs.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-200">{t('support.relatedFaq')}</p>
          <ul className="mt-2 space-y-1">
            {relatedFaqs.map((item) => <li key={item.id} className="text-xs text-gray-400">• {item.question}</li>)}
          </ul>
          <Link to={ROUTES.FAQ} className="mt-2 inline-flex text-xs text-cyan-300 hover:text-cyan-200">{t('support.toFaq')}</Link>
        </div>
      )}

      {relatedGuides.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-200">{t('support.relatedGuide')}</p>
          <ul className="mt-2 space-y-1">
            {relatedGuides.map((item) => (
              <li key={item.id}>
                <Link to={ROUTES.SUPPORT_GUIDE_DETAIL.replace(':slug', item.slug)} className="text-xs text-gray-400 hover:text-cyan-200">• {item.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 border-t border-cyan-900/40 pt-2">
        <Link to={ROUTES.SUPPORT_CENTER} className="text-xs text-cyan-300 hover:text-cyan-200">{t('support.toSupportCenter')}</Link>
      </div>
    </aside>
  )
}
