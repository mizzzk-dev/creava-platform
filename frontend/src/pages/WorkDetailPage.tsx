import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSlugDetail } from '@/hooks'
import { getWorkDetail } from '@/modules/works/api'
import { getMediaUrl, formatDate } from '@/utils'
import { truncateForDescription, SITE_URL, SITE_NAME } from '@/lib/seo'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import StructuredData from '@/components/seo/StructuredData'
import ContentAccessGuard from '@/components/guards/ContentAccessGuard'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import SkeletonDetail from '@/components/common/SkeletonDetail'
import Badge from '@/components/common/Badge'
import type { Work } from '@/types'

export default function WorkDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const { item, loading, error, notFound } = useSlugDetail<Work>(getWorkDetail, slug)

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      {/* back link */}
      <Link
        to={ROUTES.WORKS}
        className="mb-8 inline-flex items-center gap-1.5 font-mono text-[11px] text-gray-400 transition-colors hover:text-gray-700"
      >
        ← {t('detail.backToList')}
      </Link>

      {loading && <SkeletonDetail />}
      {error && <ErrorState message={error} />}
      {notFound && <NotFoundState backTo={ROUTES.WORKS} />}

      {item && (
        <ContentAccessGuard item={item}>
          <PageHead
            title={item.title}
            description={item.description ? truncateForDescription(item.description) : undefined}
            ogImage={getMediaUrl(item.thumbnail) ?? undefined}
            ogType="article"
          />
          <StructuredData
            schema={{
              type: 'BreadcrumbList',
              items: [
                { name: 'Home', url: SITE_URL },
                { name: 'Works', url: `${SITE_URL}${ROUTES.WORKS}` },
                { name: item.title, url: `${SITE_URL}${detailPath.work(item.slug)}` },
              ],
            }}
          />
          <StructuredData
            schema={{
              type: 'Article',
              headline: item.title,
              url: `${SITE_URL}${detailPath.work(item.slug)}`,
              description: item.description ? truncateForDescription(item.description) : undefined,
              datePublished: item.publishAt ?? undefined,
              image: getMediaUrl(item.thumbnail) ?? undefined,
              authorName: SITE_NAME,
            }}
          />

          {/* cover image */}
          {item.thumbnail && (
            <div className="mb-10 overflow-hidden bg-gray-100" style={{ aspectRatio: '16 / 9' }}>
              <img
                src={getMediaUrl(item.thumbnail, 'large') ?? getMediaUrl(item.thumbnail)!}
                alt={item.thumbnail.alternativeText ?? item.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <article className="max-w-3xl">
            <header>
              {/* badges */}
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                {item.isFeatured && <Badge variant="featured" />}
                {item.accessStatus === 'fc_only' && <Badge variant="fc" />}
                {item.accessStatus === 'limited' && <Badge variant="limited" />}
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                {item.title}
              </h1>

              <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                {item.category && (
                  <div className="flex items-baseline gap-1.5">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-gray-300">category</dt>
                    <dd className="font-mono text-xs text-gray-500">{item.category}</dd>
                  </div>
                )}
                {item.publishAt && (
                  <div className="flex items-baseline gap-1.5">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-gray-300">date</dt>
                    <dd className="font-mono text-xs text-gray-500">{formatDate(item.publishAt)}</dd>
                  </div>
                )}
              </dl>
            </header>

            {item.description && (
              <div className="mt-8 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {item.description}
              </div>
            )}

            {/* external link */}
            {item.externalUrl && (
              <div className="mt-8">
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                >
                  View project
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
