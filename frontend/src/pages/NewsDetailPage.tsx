import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSlugDetail } from '@/hooks'
import { getNewsDetail } from '@/modules/news/api'
import { getMediaUrl, formatDate } from '@/utils'
import { truncateForDescription, SITE_NAME, SITE_URL } from '@/lib/seo'
import { ROUTES } from '@/lib/routeConstants'
import ContentAccessGuard from '@/components/guards/ContentAccessGuard'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import SkeletonDetail from '@/components/common/SkeletonDetail'
import Badge from '@/components/common/Badge'
import SnsLinks from '@/components/common/SnsLinks'
import type { NewsItem } from '@/types'
import { trackViewHistory } from '@/modules/store/lib/commerceOptimization'

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const { item, loading, error, notFound } = useSlugDetail<NewsItem>(getNewsDetail, slug)


  useEffect(() => {
    if (!item) return
    trackViewHistory('news', item.slug)
  }, [item])

  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      {/* back link */}
      <Link
        to={ROUTES.NEWS}
        className="mb-8 inline-flex items-center gap-1.5 font-mono text-[11px] text-gray-400 dark:text-gray-600 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
      >
        ← {t('detail.backToList')}
      </Link>

      {loading && <SkeletonDetail />}
      {error && <ErrorState message={error} />}
      {notFound && <NotFoundState backTo={ROUTES.NEWS} />}

      {item && (
        <ContentAccessGuard item={item}>
          <PageHead
            title={item.title}
            description={item.body ? truncateForDescription(item.body) : undefined}
            ogImage={getMediaUrl(item.thumbnail) ?? undefined}
            ogType="article"
          />
          <StructuredData
            schema={{
              type: 'Article',
              headline: item.title,
              description: item.body ? truncateForDescription(item.body) : undefined,
              datePublished: item.publishAt ?? undefined,
              image: getMediaUrl(item.thumbnail) ?? undefined,
              authorName: SITE_NAME,
              url: `${SITE_URL}${ROUTES.NEWS_DETAIL.replace(':slug', slug ?? '')}`,
            }}
          />
          <StructuredData
            schema={{
              type: 'BreadcrumbList',
              items: [
                { name: 'Home', url: SITE_URL },
                { name: t('nav.news'), url: `${SITE_URL}${ROUTES.NEWS}` },
                { name: item.title, url: `${SITE_URL}${ROUTES.NEWS_DETAIL.replace(':slug', slug ?? '')}` },
              ],
            }}
          />

          {/* cover image */}
          {item.thumbnail && (
            <div className="mb-10 overflow-hidden bg-gray-100 dark:bg-gray-800" style={{ aspectRatio: '16 / 9' }}>
              <img
                src={getMediaUrl(item.thumbnail, 'large') ?? getMediaUrl(item.thumbnail)!}
                alt={item.thumbnail.alternativeText ?? item.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <article className="max-w-2xl">
            <header>
              {/* status badges */}
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                {item.accessStatus === 'fc_only' && <Badge variant="fc" />}
                {item.accessStatus === 'limited' && <Badge variant="limited" />}
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 leading-snug">
                {item.title}
              </h1>

              {/* 公開日 — 主軸として表示 */}
              {item.publishAt && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-gray-300 dark:text-gray-700 select-none">
                    published
                  </span>
                  <time
                    dateTime={item.publishAt}
                    className="font-mono text-xs text-gray-500 dark:text-gray-400"
                  >
                    {formatDate(item.publishAt)}
                  </time>
                </div>
              )}

              <div className="mt-6 h-px bg-gray-100 dark:bg-gray-800" />
            </header>

            {item.body && (
              <div className="mt-8 whitespace-pre-wrap text-sm leading-8 text-gray-700 dark:text-gray-300">
                {item.body}
              </div>
            )}

            {/* SNS share / follow */}
            <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800">
              <SnsLinks />
            </div>
          </article>
        </ContentAccessGuard>
      )}
    </section>
  )
}
