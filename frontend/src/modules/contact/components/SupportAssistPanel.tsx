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
