import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSlugDetail } from '@/hooks'
import { getEventDetail } from '@/modules/events/api'
import { formatDate } from '@/utils'
import { truncateForDescription } from '@/lib/seo'
import { ROUTES } from '@/lib/routeConstants'
import ContentAccessGuard from '@/components/guards/ContentAccessGuard'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import SkeletonDetail from '@/components/common/SkeletonDetail'
import Badge from '@/components/common/Badge'
import type { Event } from '@/types'
import FavoriteToggleButton from '@/modules/personalization/components/FavoriteToggleButton'
import { trackView } from '@/modules/personalization/storage'

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const { item, loading, error, notFound } = useSlugDetail<Event>(getEventDetail, slug)

  useEffect(() => {
    if (!item) return
    trackView({ kind: 'event', slug: item.slug, title: item.title, href: ROUTES.EVENT_DETAIL.replace(':slug', item.slug), sourceSite: 'main' })
  }, [item])

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      {/* back link */}
      <Link
        to={ROUTES.EVENTS}
        className="mb-8 inline-flex items-center gap-1.5 font-mono text-[11px] text-gray-400 transition-colors hover:text-gray-700"
      >
        ← {t('events.backToEvents')}
      </Link>

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
              {/* status badges */}
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                {item.accessStatus === 'fc_only' && <Badge variant="fc" />}
                {item.accessStatus === 'limited' && <Badge variant="limited" />}
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                {item.title}
              </h1>
              <div className="mt-3">
                <FavoriteToggleButton
                  location="event_detail"
                  item={{ kind: 'event', slug: item.slug, title: item.title, href: ROUTES.EVENT_DETAIL.replace(':slug', item.slug), sourceSite: 'main' }}
                />
              </div>

              <dl className="mt-4 space-y-1.5">
                {item.startAt && (
                  <div className="flex items-baseline gap-2">
                    <dt className="w-14 font-mono text-[10px] uppercase tracking-wider text-gray-300">date</dt>
                    <dd className="font-mono text-xs text-gray-500">
                      {formatDate(item.startAt)}
                      {item.endAt && ` – ${formatDate(item.endAt)}`}
                    </dd>
                  </div>
                )}
                {item.venue && (
                  <div className="flex items-baseline gap-2">
                    <dt className="w-14 font-mono text-[10px] uppercase tracking-wider text-gray-300">venue</dt>
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

            {/* booking CTA */}
            {item.bookingLink && (
              <div className="mt-8">
                <a
                  href={item.bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                >
                  {t('events.book')}
                  <span className="font-mono text-xs opacity-60">↗</span>
                </a>
              </div>
            )}
          </article>
        </ContentAccessGuard>
      )}
    </section>
  )
}
