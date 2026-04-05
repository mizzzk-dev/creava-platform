import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useStrapiCollection } from '@/hooks'
import { getWorksList } from '@/modules/works/api'
import { getMediaUrl } from '@/utils'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import SectionHeader from '@/components/common/SectionHeader'
import WorkCard from '@/components/cards/WorkCard'
import Badge from '@/components/common/Badge'
import type { Work } from '@/types/content'

function hasCaseStudy(work: Work) {
  return Boolean(
    work.caseStudyBackground
    || work.caseStudyGoal
    || work.caseStudyApproach
    || work.caseStudyImplementation
    || work.caseStudyResult,
  )
}

/** Bento layout: 4 items in asymmetric 3-col grid */
function BentoGrid({ items }: { items: Work[] }) {
  const [first, ...rest] = items.slice(0, 4)
  const firstThumb = getMediaUrl(first?.thumbnail, 'large') ?? getMediaUrl(first?.thumbnail)

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
      {/* first item — spans 2 cols on desktop, taller aspect */}
      {first && (
        <Link
          to={detailPath.work(first.slug)}
          className="group relative col-span-2 overflow-hidden bg-gray-100 md:col-span-2"
          style={{ aspectRatio: '2 / 1' }}
        >
          {firstThumb ? (
            <img
              src={firstThumb}
              alt={first.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="dot-grid flex h-full w-full items-center justify-center opacity-40">
              <span className="font-mono text-[10px] text-gray-300">01</span>
            </div>
          )}

          {/* overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />

          {/* bottom meta */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                {first.category && (
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-white/60">
                    {first.category}
                  </span>
                )}
                <h3 className="mt-0.5 text-base font-medium text-white">
                  {first.title}
                </h3>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {hasCaseStudy(first) && (
                  <span className="rounded-sm border border-cyan-200/70 bg-cyan-50/90 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-cyan-700">
                    case
                  </span>
                )}
                {first.isFeatured && <Badge variant="featured" />}
                {first.accessStatus === 'fc_only' && <Badge variant="fc" />}
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* remaining items — single col on desktop */}
      {rest.slice(0, 3).map((work, i) => (
        <div key={work.id} className={i === 0 ? 'row-span-1 md:row-span-1' : ''}>
          <WorkCard
            title={work.title}
            href={detailPath.work(work.slug)}
            category={work.category}
            thumbnailUrl={getMediaUrl(work.thumbnail, 'small') ?? getMediaUrl(work.thumbnail)}
            index={i + 1}
            isFeatured={work.isFeatured}
            status={work.accessStatus}
            hasCaseStudy={hasCaseStudy(work)}
          />
        </div>
      ))}
    </div>
  )
}

function WorksPlaceholder({ count }: { count: number }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="dot-grid flex aspect-square items-center justify-center rounded-sm border border-dashed border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/40"
        >
          <span className="font-mono text-[10px] text-gray-400 dark:text-gray-600">
            slot_{String(i + 1).padStart(2, '0')}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function FeaturedWorksSection() {
  const { t } = useTranslation()
  const { items, loading } = useStrapiCollection<Work>(() =>
    getWorksList({ pagination: { pageSize: 8 } }),
  )

  const featured = items
    ? items.some((w) => w.isFeatured)
      ? items.filter((w) => w.isFeatured)
      : items.slice(0, 4)
    : []

  return (
    <motion.section
      className="mx-auto max-w-5xl px-4 py-20"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <SectionHeader
        label={t('home.works.title')}
        viewAllTo={ROUTES.WORKS}
        viewAllLabel={t('home.works.viewAll')}
      />

      {/* loading skeleton */}
      {loading && (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="skeleton col-span-2 bg-gray-100 md:col-span-2" style={{ aspectRatio: '2 / 1' }} />
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton aspect-square bg-gray-100" />
          ))}
        </div>
      )}

      {!loading && featured.length === 0 && (
        <div className="mt-8 rounded-sm border border-dashed border-gray-200 p-6 dark:border-gray-800">
          <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500">
            {t('home.works.empty')}
          </p>
          <Link
            to={ROUTES.CONTACT}
            className="focus-ring mt-3 inline-flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            {t('home.works.emptyCta')} →
          </Link>
        </div>
      )}

      {!loading && featured.length > 0 && <BentoGrid items={featured} />}
      {!loading && featured.length > 0 && featured.length < 4 && <WorksPlaceholder count={4 - featured.length} />}

      {/* view all link */}
      {!loading && featured.length > 0 && (
        <div className="mt-6 flex justify-end">
          <Link
            to={ROUTES.WORKS}
            className="font-mono text-[11px] text-gray-400 transition-colors hover:text-gray-700"
          >
            {t('home.works.viewAll')} →
          </Link>
        </div>
      )}
    </motion.section>
  )
}
