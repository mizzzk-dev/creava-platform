import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useStrapiCollection } from '@/hooks'
import { getEventsList } from '@/modules/events/api'
import { formatDate } from '@/utils'
import { detailPath } from '@/lib/routeConstants'
import PageHead from '@/components/seo/PageHead'
import SkeletonListItem from '@/components/common/SkeletonListItem'
import type { Event } from '@/types'

function EventStatusBadge({ event }: { event: Event }) {
  const now = new Date()
  const start = event.startAt ? new Date(event.startAt) : null
  const end = event.endAt ? new Date(event.endAt) : null

  if (end && now > end) {
    return (
      <span className="inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-400">
        ended
      </span>
    )
  }
  if (start && now >= start) {
    return (
      <span className="inline-flex items-center rounded-sm bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-600">
        now
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-sm bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-blue-500">
      upcoming
    </span>
  )
}

export default function EventsPage() {
  const { t } = useTranslation()

  const { items, loading, error } = useStrapiCollection<Event>(
    () => getEventsList({ pagination: { pageSize: 20 } }),
  )

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <PageHead title={t('nav.events')} description={t('seo.events')} />

      <header className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-300">
          <span className="mr-1 text-gray-200">//</span>
          {t('nav.events')}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          {t('nav.events')}
        </h1>
      </header>

      {loading && (
        <ul className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonListItem key={i} />
          ))}
        </ul>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-600">{t('common.error')}</p>
          <p className="mt-1 font-mono text-xs text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && items !== null && items.length === 0 && (
        <p className="text-sm text-gray-400">{t('events.empty')}</p>
      )}

      {items && items.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {items.map((event) => (
            <li key={event.id} className="py-5">
              <Link
                to={detailPath.event(event.slug)}
                className="group flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <EventStatusBadge event={event} />
                    {event.status === 'fc_only' && (
                      <span className="rounded-sm bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
                        fc
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-600">
                    {event.title}
                    <span className="ml-1.5 opacity-0 transition-opacity group-hover:opacity-100">→</span>
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {event.startAt && (
                      <p className="font-mono text-[11px] text-gray-400">
                        {formatDate(event.startAt)}
                        {event.endAt && ` – ${formatDate(event.endAt)}`}
                      </p>
                    )}
                    {event.venue && (
                      <p className="font-mono text-[11px] text-gray-300">
                        @ {event.venue}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
