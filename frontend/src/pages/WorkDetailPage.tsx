import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSlugDetail } from '@/hooks'
import { getWorkDetail } from '@/modules/works/api'
import { getMediaUrl, formatDate } from '@/utils'
import { truncateForDescription } from '@/lib/seo'
import { ROUTES } from '@/lib/routeConstants'
import ContentAccessGuard from '@/components/guards/ContentAccessGuard'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import SkeletonDetail from '@/components/common/SkeletonDetail'
import Badge from '@/components/common/Badge'
import type { Work } from '@/types'

function CaseStudySection({ item }: { item: Work }) {
  const { t } = useTranslation()

  const rows = [
    { label: t('work.case.background'), value: item.caseStudyBackground },
    { label: t('work.case.goal'), value: item.caseStudyGoal },
    { label: t('work.case.approach'), value: item.caseStudyApproach },
    { label: t('work.case.implementation'), value: item.caseStudyImplementation },
    { label: t('work.case.result'), value: item.caseStudyResult },
  ].filter((row) => Boolean(row.value))

  if (rows.length === 0) return null

  return (
    <section className="mt-12 rounded-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8">
      <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
        {t('work.case.label')}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">{t('work.case.title')}</h2>

      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">{row.label}</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-gray-600 dark:text-gray-400">{row.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          to={ROUTES.CONTACT}
          className="inline-flex items-center bg-gray-900 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-gray-900 transition-colors hover:bg-gray-700 dark:hover:bg-gray-100"
        >
          {t('home.contact.cta')}
        </Link>
        <Link
          to={ROUTES.PRICING}
          className="inline-flex items-center border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:border-gray-400 dark:hover:border-gray-500"
        >
          {t('about.ctaPricing')}
        </Link>
      </div>
    </section>
  )
}

export default function WorkDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const { item, loading, error, notFound } = useSlugDetail<Work>(getWorkDetail, slug)

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
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
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                {item.isFeatured && <Badge variant="featured" />}
                {item.accessStatus === 'fc_only' && <Badge variant="fc" />}
                {item.accessStatus === 'limited' && <Badge variant="limited" />}
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
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
              <div className="mt-8 whitespace-pre-wrap text-sm leading-7 text-gray-700 dark:text-gray-300">
                {item.description}
              </div>
            )}

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

          <CaseStudySection item={item} />
        </ContentAccessGuard>
      )}
    </section>
  )
}
