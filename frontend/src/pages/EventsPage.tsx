import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useStrapiCollection } from '@/hooks'
import { getEventsList } from '@/modules/events/api'
import { formatDate } from '@/utils'
import { detailPath } from '@/lib/routeConstants'
import PageHead from '@/components/seo/PageHead'
import SkeletonListItem from '@/components/common/SkeletonListItem'
import ErrorState from '@/components/common/ErrorState'
import { useListPageWebVitals } from '@/modules/analytics/webVitals'
import { trackCtaClick } from '@/modules/analytics/tracking'
import EventCalendar from '@/modules/events/components/EventCalendar'
import type { Event } from '@/types'

type ViewMode = 'calendar' | 'list'

function EventStatusBadge({ event }: { event: Event }) {
  const { t } = useTranslation()
  const now = new Date()
  const start = event.startAt ? new Date(event.startAt) : null
  const end = event.endAt ? new Date(event.endAt) : null

  if (end && now > end) {
    return (
      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        {t('events.statusEnded', { defaultValue: '終了' })}
      </span>
    )
  }
  if (start && now >= start) {
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
        {t('events.statusNow', { defaultValue: '開催中' })}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
      {t('events.statusUpcoming', { defaultValue: '予定' })}
    </span>
  )
}

export default function EventsPage() {
  const { t } = useTranslation()
  useListPageWebVitals('events-list')

  const [viewMode, setViewMode] = useState<ViewMode>('calendar')

  const { items, loading, error, refetch } = useStrapiCollection<Event>(
    () => getEventsList({ pagination: { pageSize: 50, withCount: false } }),
  )

  const switchMode = (mode: ViewMode) => {
    setViewMode(mode)
    trackCtaClick('events_page', `view_${mode}`)
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
      <PageHead title={t('nav.events')} description={t('seo.events')} />

      {/* ── Header ── */}
      <header className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
          schedule &amp; events
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          {t('nav.events')}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t('seo.events', { defaultValue: 'ライブ・展示・ワークショップなど開催イベントの一覧です。' })}
        </p>
      </header>

      {/* ── View mode toggle ── */}
      <div className="mb-8 flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit dark:border-gray-700 dark:bg-gray-900">
        {(['calendar', 'list'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => switchMode(mode)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              viewMode === mode
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {mode === 'calendar'
              ? t('events.viewCalendar', { defaultValue: 'カレンダー' })
              : t('events.viewList', { defaultValue: 'リスト' })}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonListItem key={i} />
          ))}
        </ul>
      )}

      {/* ── Error ── */}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {/* ── Empty ── */}
      {!loading && !error && items !== null && items.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500">{t('events.empty')}</p>
      )}

      {/* ── Content ── */}
      {items && items.length > 0 && (
        <>
          {viewMode === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <EventCalendar events={items} />

              {/* ── Upcoming events quick list below calendar ── */}
              <div className="mt-10 space-y-1">
                <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {t('events.upcomingList', { defaultValue: '直近のイベント' })}
                </p>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items
                    .filter((e) => {
                      const end = e.endAt ? new Date(e.endAt) : e.startAt ? new Date(e.startAt) : null
                      return !end || end >= new Date()
                    })
                    .slice(0, 5)
                    .map((event) => (
                      <li key={event.id} className="py-4">
                        <Link
                          to={detailPath.event(event.slug)}
                          onClick={() => trackCtaClick('events_page', 'upcoming_item_click', { slug: event.slug })}
                          className="group flex items-start justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <EventStatusBadge event={event} />
                              {event.accessStatus === 'fc_only' && (
                                <span className="rounded-md bg-violet-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
                                  FC
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-600 dark:text-gray-100 dark:group-hover:text-gray-300">
                              {event.title}
                              <span className="ml-1.5 opacity-0 transition-opacity group-hover:opacity-100">→</span>
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              {event.startAt && (
                                <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500">
                                  {formatDate(event.startAt)}
                                  {event.endAt && ` – ${formatDate(event.endAt)}`}
                                </p>
                              )}
                              {event.venue && (
                                <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500">
                                  @ {event.venue}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            </motion.div>
          )}

          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((event) => (
                  <li key={event.id} className="py-5">
                    <Link
                      to={detailPath.event(event.slug)}
                      onClick={() => trackCtaClick('events_page', 'list_item_click', { slug: event.slug })}
                      className="group flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <EventStatusBadge event={event} />
                          {event.accessStatus === 'fc_only' && (
                            <span className="rounded-md bg-violet-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
                              FC
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-600 dark:text-gray-100 dark:group-hover:text-gray-300">
                          {event.title}
                          <span className="ml-1.5 opacity-0 transition-opacity group-hover:opacity-100">→</span>
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          {event.startAt && (
                            <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500">
                              {formatDate(event.startAt)}
                              {event.endAt && ` – ${formatDate(event.endAt)}`}
                            </p>
                          )}
                          {event.venue && (
                            <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500">
                              @ {event.venue}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </>
      )}
    </section>
  )
}
