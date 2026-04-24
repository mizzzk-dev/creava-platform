import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import PageHead from '@/components/seo/PageHead'
import { Link, useSearchParams } from 'react-router-dom'
import { ROUTES } from '@/lib/routeConstants'
import { SplitWords } from '@/components/common/KineticText'
import DynamicForm from '@/modules/contact/components/DynamicForm'
import SupportAssistPanel from '@/modules/contact/components/SupportAssistPanel'
import { fetchFormDefinitions, type FormDefinition } from '@/modules/contact/lib/formDefinitions'

type FormTab = { key: string; icon: string; num: string; definition: FormDefinition }

function pickLocale(localized: Record<string, string>, locale: string): string {
  const normalized = locale.split('-')[0]
  return localized[normalized] ?? localized.ja ?? Object.values(localized)[0] ?? ''
}

export default function ContactPage() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [definitions, setDefinitions] = useState<FormDefinition[]>([])

  useEffect(() => {
    fetchFormDefinitions(i18n.language).then(setDefinitions).catch(() => setDefinitions([]))
  }, [i18n.language])

  const tabs = useMemo<FormTab[]>(() => definitions.map((definition, index) => ({
    key: definition.formType,
    icon: ['✉', '◈', '✦', '◎', '◆', '▲'][index] ?? '◉',
    num: String(index + 1).padStart(2, '0'),
    definition,
  })), [definitions])

  const initialTab = useMemo(() => {
    const requested = searchParams.get('tab')
    if (requested && tabs.some((tab) => tab.key === requested)) return requested
    return tabs[0]?.key ?? 'contact'
  }, [searchParams, tabs])
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const prefill = useMemo(() => ({
    subject: searchParams.get('prefill_subject') ?? '',
    message: searchParams.get('prefill_message') ?? '',
    inquiryCategory: searchParams.get('prefill_category') ?? '',
    assistantSessionState: searchParams.get('assistant_session_state') ?? '',
    semanticRetrievalState: searchParams.get('semantic_retrieval_state') ?? '',
    retrievalConfidenceState: searchParams.get('retrieval_confidence_state') ?? '',
    proactiveRecommendationState: searchParams.get('proactive_recommendation_state') ?? '',
    proactiveIssueSignalState: searchParams.get('proactive_issue_signal_state') ?? '',
    proactiveInterventionState: searchParams.get('proactive_intervention_state') ?? '',
    proactivePreventionOutcomeState: searchParams.get('proactive_prevention_outcome_state') ?? '',
    rankingState: searchParams.get('ranking_state') ?? '',
    rankingReason: searchParams.get('ranking_reason') ?? '',
    candidateSetState: searchParams.get('candidate_set_state') ?? '',
    orchestrationState: searchParams.get('orchestration_state') ?? '',
    orchestrationPolicyState: searchParams.get('orchestration_policy_state') ?? '',
    lifecycleAwareState: searchParams.get('lifecycle_aware_state') ?? '',
    experimentState: searchParams.get('experiment_state') ?? '',
    experimentVariantState: searchParams.get('experiment_variant_state') ?? '',
    policyState: searchParams.get('policy_state') ?? '',
    policyEffectivenessState: searchParams.get('policy_effectiveness_state') ?? '',
    policyDraftState: searchParams.get('policy_draft_state') ?? '',
    policyReviewState: searchParams.get('policy_review_state') ?? '',
    policyApprovalState: searchParams.get('policy_approval_state') ?? '',
    policyActivationState: searchParams.get('policy_activation_state') ?? '',
    experimentGuardrailState: searchParams.get('experiment_guardrail_state') ?? '',
    guardrailState: searchParams.get('guardrail_state') ?? '',
    guardrailReason: searchParams.get('guardrail_reason') ?? '',
    multilingualSafetyState: searchParams.get('multilingual_safety_state') ?? '',
    multilingualSafetyReviewState: searchParams.get('multilingual_safety_review_state') ?? '',
    rollbackState: searchParams.get('rollback_state') ?? '',
    rollbackReason: searchParams.get('rollback_reason') ?? '',
    rollbackPreparednessState: searchParams.get('rollback_preparedness_state') ?? '',
    auditState: searchParams.get('audit_state') ?? '',
    auditTrailState: searchParams.get('audit_trail_state') ?? '',
    auditVisibilityState: searchParams.get('audit_visibility_state') ?? '',
    localeImpactState: searchParams.get('locale_impact_state') ?? '',
    changeRiskState: searchParams.get('change_risk_state') ?? '',
  }), [searchParams])

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const active = tabs.find((tab) => tab.key === activeTab) ?? tabs[0]

  return (
    <section className="relative mx-auto max-w-2xl px-4 py-20 overflow-hidden">
      <PageHead title={t('nav.contact')} description={t('seo.contact')} />
      <div className="cyber-grid pointer-events-none absolute inset-0 opacity-20" />
      <div className="pointer-events-none absolute right-4 top-8 h-8 w-8 border-r border-t border-cyan-500/15" />
      <div className="pointer-events-none absolute bottom-8 left-4 h-8 w-8 border-b border-l border-cyan-500/15" />

      <div className="relative">
        <motion.p className="section-eyebrow mb-5" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          contact
        </motion.p>

        <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-4xl">
          <SplitWords text={t('nav.contact')} staggerMs={55} />
        </h1>

        <motion.p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-[rgba(180,190,220,0.6)]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }}>
          {active ? pickLocale(active.definition.formDescription, i18n.language) : '...'}
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.4 }}>
          <Link to={ROUTES.PRICING} className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cyan-500/50 transition-colors hover:text-cyan-400">
            料金の目安はこちら →
          </Link>
        </motion.div>

        <motion.div className="mt-8 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(tabs.length, 1), 2)}, minmax(0, 1fr))` }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.45 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setSearchParams({ tab: tab.key })
                }}
                className="group relative overflow-hidden p-4 text-left transition-all duration-300"
                style={{
                  border: isActive ? '1px solid rgba(6,182,212,0.35)' : '1px solid rgba(6,182,212,0.1)',
                  background: isActive ? 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, transparent 65%)' : 'transparent',
                }}
              >
                <span className="absolute right-3 top-2.5 font-mono text-[9px] tracking-widest" style={{ color: isActive ? 'rgba(6,182,212,0.5)' : 'rgba(6,182,212,0.15)' }}>{tab.num}</span>
                <span className="mb-2 block font-mono text-sm" style={{ color: isActive ? 'rgba(6,182,212,0.8)' : 'rgba(6,182,212,0.25)' }}>{tab.icon}</span>
                <p className="text-xs font-medium transition-colors" style={{ color: isActive ? 'rgb(229,231,235)' : 'rgb(107,114,128)' }}>{pickLocale(tab.definition.formTitle, i18n.language)}</p>
              </button>
            )
          })}
        </motion.div>

        <motion.div className="mt-3 glass-cyber overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <div className="flex items-center gap-1.5 border-b border-[rgba(6,182,212,0.1)] px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-red-400/50" />
            <span className="h-2 w-2 rounded-full bg-amber-400/50" />
            <span className="h-2 w-2 rounded-full bg-cyan-500/50" />
            <span className="ml-3 font-mono text-[9px] uppercase tracking-widest text-cyan-500/30">mizzz / {active?.definition.formType ?? '...'}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={active?.key ?? 'none'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }} className="px-6 py-8">
              <SupportAssistPanel formDefinition={active?.definition} handoffContext={prefill} />
              {active ? <DynamicForm definition={active.definition} sourcePage={`/contact?tab=${active.definition.formType}`} prefill={prefill} /> : <p className="text-sm text-gray-500">Loading...</p>}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
