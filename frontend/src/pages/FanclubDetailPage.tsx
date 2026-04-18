import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSlugDetail } from '@/hooks'
import { getFanclubDetail } from '@/modules/fanclub/api'
import { getMediaUrl, formatDate } from '@/utils'
import { truncateForDescription } from '@/lib/seo'
import { ROUTES } from '@/lib/routeConstants'
import FanclubGuard from '@/components/guards/FanclubGuard'
import ContentAccessGuard from '@/components/guards/ContentAccessGuard'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import SkeletonDetail from '@/components/common/SkeletonDetail'
import MemberGuideCard from '@/components/common/MemberGuideCard'
import type { FanclubContent } from '@/types'
import FavoriteToggleButton from '@/modules/personalization/components/FavoriteToggleButton'
import { trackView } from '@/modules/personalization/storage'

export default function FanclubDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      {/* back link */}
      <Link
        to={ROUTES.FANCLUB}
        className="mb-8 inline-flex items-center gap-1.5 font-mono text-[11px] text-gray-400 transition-colors hover:text-gray-700"
      >
        ← {t('detail.backToList')}
      </Link>

      <FanclubGuard>
        <FanclubDetailContent slug={slug} />
      </FanclubGuard>
    </section>
  )
}

function FanclubDetailContent({ slug }: { slug: string | undefined }) {
  const { item, loading, error, notFound } = useSlugDetail<FanclubContent>(
    getFanclubDetail,
    slug,
  )

  useEffect(() => {
    if (!item) return
    trackView({ kind: 'fanclub', slug: item.slug, title: item.title, href: ROUTES.FANCLUB_DETAIL.replace(':slug', item.slug), sourceSite: 'fc' })
  }, [item])

  if (loading) return <SkeletonDetail />
  if (error) return <ErrorState message={error} />
  if (notFound || !item) return <NotFoundState backTo={ROUTES.FANCLUB} />

  return (
    <ContentAccessGuard item={item}>
      <PageHead
        title={item.title}
        description={item.body ? truncateForDescription(item.body) : undefined}
        ogImage={getMediaUrl(item.thumbnail) ?? undefined}
        ogType="article"
        noindex
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
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            {item.title}
          </h1>
          <div className="mt-3">
            <FavoriteToggleButton
              location="fanclub_detail"
              item={{ kind: 'fanclub', slug: item.slug, title: item.title, href: ROUTES.FANCLUB_DETAIL.replace(':slug', item.slug), sourceSite: 'fc' }}
            />
          </div>
          {item.publishAt && (
            <p className="mt-2 font-mono text-xs text-gray-400">{formatDate(item.publishAt)}</p>
          )}
        </header>

        {item.body && (
          <div className="mt-10 whitespace-pre-wrap text-sm leading-7 text-gray-700">
            {item.body}
          </div>
        )}
        <MemberGuideCard />
      </article>
    </ContentAccessGuard>
  )
}
