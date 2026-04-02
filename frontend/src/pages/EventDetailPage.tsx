import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSlugDetail } from '@/hooks'
import { getEventDetail } from '@/modules/events/api'
import ContentAccessGuard from '@/components/guards/ContentAccessGuard'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import SkeletonDetail from '@/components/common/SkeletonDetail'
import { formatDate } from '@/utils'
import { truncateForDescription } from '@/lib/seo'
import { ROUTES } from '@/lib/routeConstants'
import type { Event } from '@/types'

function BookingButton({ event }: { event: Event }) {
  const { t } = useTranslation()
  if (!('bookingLink' in event) || !(event as Event & { bookingLink?: string }).bookingLink) {
    return null
  }
  const link = (event as Event & { bookingLink?: string }).bookingLink!
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
    >
      {t('events.book')}
      <span className="font-mono text-xs opacity-60">↗</span>
    </a>
  )
}

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { item, loading, error, notFound } = useSlugDetail<Event>(getEventDetail, slug)

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      {loading && <SkeletonDetail />}
      {error && <ErrorState message={error} />}
      {notFound && <NotFoundState backTo={ROUTES.EVENTS} />}

      {item && (
        <ContentAccessGuard item={item}>
          <PageHead
            title={item.title}
            description={item.description ? truncateForDescription(item.description) : undefined}
            ogType="article"
          />
          <article className="max-w-3xl">
            <header>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                {item.title}
              </h1>

              <dl className="mt-4 space-y-1.5">
                {item.startAt && (
                  <div className="flex items-baseline gap-2">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-gray-300 w-14">date</dt>
                    <dd className="font-mono text-xs text-gray-500">
                      {formatDate(item.startAt)}
                      {item.endAt && ` – ${formatDate(item.endAt)}`}
                    </dd>
                  </div>
                )}
                {item.venue && (
                  <div className="flex items-baseline gap-2">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-gray-300 w-14">venue</dt>
                    <dd className="font-mono text-xs text-gray-500">{item.venue}</dd>
                  </div>
                )}
              </dl>
            </header>

            {item.description && (
              <div className="mt-8 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {item.description}
              </div>
            )}

            <div className="mt-8">
              <BookingButton event={item} />
            </div>
          </article>
        </ContentAccessGuard>
      )}
    </section>
  )
}
