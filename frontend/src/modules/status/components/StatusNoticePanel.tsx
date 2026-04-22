import { Link } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/lib/routeConstants'
import type { PublicStatusResponse } from '@/modules/status/api'
import { trackMizzzEvent } from '@/modules/analytics/tracking'

interface StatusNoticePanelProps {
  summary: PublicStatusResponse['publicStatusSummary']
  className?: string
}

export default function StatusNoticePanel({ summary, className = '' }: StatusNoticePanelProps) {
  const { t } = useTranslation()
  const badge = useMemo(() => {
    if (summary.statusState === 'major_outage') return t('status.major')
    if (summary.statusState === 'partial_outage') return t('status.partial')
    if (summary.statusState === 'degraded_performance') return t('status.degraded')
    if (summary.statusState.startsWith('maintenance')) return t('status.maintenance')
    if (summary.statusState === 'recovering') return t('status.recovering')
    return t('status.operational')
  }, [summary.statusState, t])

  useEffect(() => {
    if (summary.statusState === 'operational') return
    trackMizzzEvent('incident_notice_banner_view', { sourceSection: 'status_notice_panel', statusState: summary.statusState, sourceArea: 'public' })
  }, [summary.statusState])

  if (summary.statusState === 'operational') return null

  return (
    <section className={`rounded-2xl border border-amber-300/60 bg-amber-50/70 p-4 text-sm dark:border-amber-700/40 dark:bg-amber-950/20 ${className}`} aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-300">{t('status.notice')}</p>
      <p className="mt-2 text-base font-semibold text-amber-950 dark:text-amber-100">{badge}</p>
      <p className="mt-1 text-amber-900 dark:text-amber-200">{summary.userActionRecommendationState}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Link to={ROUTES.STATUS} onClick={() => trackMizzzEvent('incident_notice_banner_click', { sourceSection: 'status_notice_panel', statusState: summary.statusState, sourceArea: 'status_page' })} className="rounded-full border border-amber-400/60 px-3 py-1 text-amber-900 dark:border-amber-500/40 dark:text-amber-100">{t('status.toStatus')}</Link>
        <Link to={ROUTES.SUPPORT_CENTER} onClick={() => trackMizzzEvent('status_cta_support_click', { sourceSection: 'status_notice_panel', statusState: summary.statusState, sourceArea: 'support' })} className="rounded-full border border-amber-400/60 px-3 py-1 text-amber-900 dark:border-amber-500/40 dark:text-amber-100">{t('status.toSupport')}</Link>
      </div>
    </section>
  )
}
