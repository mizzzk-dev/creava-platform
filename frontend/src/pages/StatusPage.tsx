import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHead from '@/components/seo/PageHead'
import { ROUTES } from '@/lib/routeConstants'
import { getPublicStatusSummary, type PublicStatusResponse } from '@/modules/status/api'
import { trackMizzzEvent } from '@/modules/analytics/tracking'

function label(state: string, t: (key: string) => string): string {
  switch (state) {
    case 'maintenance_scheduled': return t('status.maintenanceScheduled')
    case 'maintenance_in_progress': return t('status.maintenanceProgress')
    case 'degraded_performance': return t('status.degraded')
    case 'partial_outage': return t('status.partial')
    case 'major_outage': return t('status.major')
    case 'recovering': return t('status.recovering')
    case 'resolved': return t('status.resolved')
    default: return t('status.operational')
  }
}

export default function StatusPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<PublicStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getPublicStatusSummary()
      .then((result) => {
        setData(result)
        trackMizzzEvent('status_page_view', {
          sourceSection: 'status_page',
          statusState: result.publicStatusSummary.statusState,
          sourceArea: 'public',
        })
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <PageHead title={`${t('status.title')} | mizzz`} description={t('status.desc')} />
      <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{t('status.title')}</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('status.desc')}</p>

      {loading && <p className="mt-8 text-sm text-gray-500">{t('status.loading')}</p>}
      {error && <p className="mt-8 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}

      {data && (
        <>
          <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">{t('status.current')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-gray-300 px-3 py-1 text-xs dark:border-gray-700">{label(data.publicStatusSummary.statusState, t)}</span>
              <span className="text-xs text-gray-500">{t('status.updated')}: {data.publicStatusSummary.lastUpdatedAt ?? 'n/a'}</span>
              <span className="text-xs text-gray-500">{t('status.visibility')}: {data.publicStatusSummary.publishingState}</span>
            </div>
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-200">{data.publicStatusSummary.userActionRecommendationState}</p>
            <p className="mt-2 text-xs text-gray-500">{t('status.areas')}: {data.publicStatusSummary.affectedAreaState.join(', ') || t('status.none')}</p>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('status.active')}</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-200">
                {data.activeIncidentCommunications.length === 0 && <li className="text-xs text-gray-500">{t('status.noActive')}</li>}
                {data.activeIncidentCommunications.map((item, i) => (
                  <li key={i} className="rounded-xl border border-gray-100 p-3 text-xs dark:border-gray-800">{String(item.publicTitle ?? item.incidentId ?? 'incident')}</li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('status.maintenance')}</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-200">
                {data.maintenanceSummary.length === 0 && <li className="text-xs text-gray-500">{t('status.noMaintenance')}</li>}
                {data.maintenanceSummary.map((item, i) => (
                  <li key={i} className="rounded-xl border border-gray-100 p-3 text-xs dark:border-gray-800">{String(item.publicTitle ?? item.maintenanceWindowId ?? 'maintenance')}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('status.postmortem')}</h2>
            <ul className="mt-3 space-y-2 text-xs text-gray-700 dark:text-gray-200">
              {data.postmortemSummary.length === 0 && <li className="text-gray-500">{t('status.noPostmortem')}</li>}
              {data.postmortemSummary.map((item, i) => (
                <li key={i} className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">{String(item.publicTitle ?? item.postmortemId ?? 'postmortem')}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Link to={ROUTES.SUPPORT_CENTER} className="rounded-full border border-gray-300 px-3 py-1 dark:border-gray-700" onClick={() => trackMizzzEvent('status_cta_support_click', { sourceSection: 'status_page', sourceArea: 'support' })}>{t('status.toSupport')}</Link>
              <Link to={ROUTES.NOTIFICATION_CENTER} className="rounded-full border border-gray-300 px-3 py-1 dark:border-gray-700" onClick={() => trackMizzzEvent('status_cta_notification_click', { sourceSection: 'status_page', sourceArea: 'notifications' })}>{t('status.toNotification')}</Link>
            </div>
          </section>
        </>
      )}
    </section>
  )
}
