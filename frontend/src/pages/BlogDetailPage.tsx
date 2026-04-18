import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSlugDetail } from '@/hooks'
import { getBlogDetail } from '@/modules/blog/api'
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
import type { BlogPost } from '@/types'
import { trackViewHistory } from '@/modules/store/lib/commerceOptimization'
import FavoriteToggleButton from '@/modules/personalization/components/FavoriteToggleButton'
import { trackView } from '@/modules/personalization/storage'

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const { item, loading, error, notFound } = useSlugDetail<BlogPost>(getBlogDetail, slug)


  useEffect(() => {
    if (!item) return
    trackViewHistory('blog', item.slug)
    trackView({ kind: 'blog', slug: item.slug, title: item.title, href: ROUTES.BLOG_DETAIL.replace(':slug', item.slug), sourceSite: 'main' })
  }, [item])

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      {/* back link */}
      <Link
        to={ROUTES.BLOG}
        className="mb-8 inline-flex items-center gap-1.5 font-mono text-[11px] text-gray-400 transition-colors hover:text-gray-700"
      >
        ← {t('detail.backToList')}
      </Link>

      {loading && <SkeletonDetail />}
      {error && <ErrorState message={error} />}
      {notFound && <NotFoundState backTo={ROUTES.BLOG} />}

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
              url: `${SITE_URL}${ROUTES.BLOG_DETAIL.replace(':slug', slug ?? '')}`,
            }}
          />
          <StructuredData
            schema={{
              type: 'BreadcrumbList',
              items: [
                { name: 'Home', url: SITE_URL },
                { name: t('nav.blog'), url: `${SITE_URL}${ROUTES.BLOG}` },
                { name: item.title, url: `${SITE_URL}${ROUTES.BLOG_DETAIL.replace(':slug', slug ?? '')}` },
              ],
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
                  location="blog_detail"
                  item={{ kind: 'blog', slug: item.slug, title: item.title, href: ROUTES.BLOG_DETAIL.replace(':slug', item.slug), sourceSite: 'main' }}
                />
              </div>

              {item.publishAt && (
                <p className="mt-2 font-mono text-xs text-gray-400">{formatDate(item.publishAt)}</p>
              )}

              {item.tags && item.tags.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-sm border border-gray-100 bg-gray-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gray-400"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </header>

            {item.body && (
              <div className="mt-10 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {item.body}
              </div>
            )}
          </article>
        </ContentAccessGuard>
      )}
    </section>
  )
}
