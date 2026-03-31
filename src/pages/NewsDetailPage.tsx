import { useParams } from 'react-router-dom'
import { useSlugDetail } from '@/hooks'
import { getNewsDetail } from '@/modules/news/api'
import ContentAccessGuard from '@/components/guards/ContentAccessGuard'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import SkeletonDetail from '@/components/common/SkeletonDetail'
import { formatDate } from '@/utils'
import { truncateForDescription } from '@/lib/seo'
import { ROUTES } from '@/lib/routeConstants'
import type { NewsItem } from '@/types'

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { item, loading, error, notFound } = useSlugDetail<NewsItem>(getNewsDetail, slug)

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      {loading && <SkeletonDetail />}
      {error && <ErrorState message={error} />}
      {notFound && <NotFoundState backTo={ROUTES.NEWS} />}

      {item && (
        <ContentAccessGuard item={item}>
          <PageHead
            title={item.title}
            description={item.body ? truncateForDescription(item.body) : undefined}
            ogImage={item.thumbnailUrl ?? undefined}
            ogType="article"
          />
          <article className="max-w-3xl">
            <header>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                {item.title}
              </h1>
              {item.publishAt && (
                <p className="mt-2 text-sm text-gray-400">{formatDate(item.publishAt)}</p>
              )}
            </header>

            {item.body && (
              <div className="mt-8 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {item.body}
              </div>
            )}
          </article>
        </ContentAccessGuard>
      )}
    </section>
  )
}
