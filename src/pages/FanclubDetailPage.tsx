import { useParams } from 'react-router-dom'
import { useSlugDetail } from '@/hooks'
import { getFanclubDetail } from '@/modules/fanclub/api'
import FanclubGuard from '@/components/guards/FanclubGuard'
import ContentAccessGuard from '@/components/guards/ContentAccessGuard'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import SkeletonDetail from '@/components/common/SkeletonDetail'
import { formatDate } from '@/utils'
import { truncateForDescription } from '@/lib/seo'
import { ROUTES } from '@/lib/routes'
import type { FanclubContent } from '@/types'

export default function FanclubDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <FanclubGuard>
        <FanclubDetailContent slug={slug} />
      </FanclubGuard>
    </section>
  )
}

/**
 * FanclubGuard 通過後（member / admin 確認済み）に描画する詳細コンテンツ
 */
function FanclubDetailContent({ slug }: { slug: string | undefined }) {
  const { item, loading, error, notFound } = useSlugDetail<FanclubContent>(
    getFanclubDetail,
    slug,
  )

  if (loading) return <SkeletonDetail />
  if (error) return <ErrorState message={error} />
  if (notFound || !item) return <NotFoundState backTo={ROUTES.FANCLUB} />

  return (
    <ContentAccessGuard item={item}>
      <PageHead
        title={item.title}
        description={item.body ? truncateForDescription(item.body) : undefined}
        ogImage={item.thumbnailUrl ?? undefined}
        ogType="article"
        noindex
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
  )
}
