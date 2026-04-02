import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useStrapiCollection } from '@/hooks'
import { getWorksList } from '@/modules/works/api'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import SectionHeader from '@/components/common/SectionHeader'
import WorkCard from '@/components/cards/WorkCard'
import Badge from '@/components/common/Badge'
import type { Work } from '@/types/content'

/** Bento layout: 4 items in asymmetric 3-col grid */
function BentoGrid({ items }: { items: Work[] }) {
  const [first, ...rest] = items.slice(0, 4)

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
      {/* first item — spans 2 cols on desktop, taller aspect */}
      {first && (
        <Link
          to={detailPath.work(first.slug)}
          className="group relative col-span-2 overflow-hidden bg-gray-100 md:col-span-2"
          style={{ aspectRatio: '2 / 1' }}
        >
          {first.thumbnailUrl ? (
            <img
              src={first.thumbnailUrl}
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
                {first.isFeatured && <Badge variant="featured" />}
                {first.status === 'fc_only' && <Badge variant="fc" />}
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
            thumbnailUrl={work.thumbnailUrl}
            index={i + 1}
            isFeatured={work.isFeatured}
            status={work.status}
          />
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
        <p className="mt-8 font-mono text-[11px] text-gray-300">{t('access.noContent')}</p>
      )}

      {!loading && featured.length > 0 && <BentoGrid items={featured} />}

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
