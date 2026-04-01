import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useStrapiCollection } from '@/hooks'
import { getWorksList } from '@/modules/works/api'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import WorkCard from '@/components/cards/WorkCard'
import type { Work } from '@/types'

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
      <div className="flex items-center justify-between">
        {/* section label */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gray-300" />
          </span>
          <h2 className="font-mono text-xs uppercase tracking-wider text-gray-400">
            {t('home.works.title')}
          </h2>
        </div>

        <Link
          to={ROUTES.WORKS}
          className="font-mono text-[10px] text-gray-300 transition-colors hover:text-gray-600"
        >
          all →
        </Link>
      </div>

      {loading && (
        <p className="mt-8 font-mono text-[11px] text-gray-300">{t('common.loading')}</p>
      )}

      {!loading && featured.length === 0 && (
        <p className="mt-8 font-mono text-[11px] text-gray-300">{t('access.noContent')}</p>
      )}

      {featured.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.slice(0, 4).map((work) => (
            <WorkCard
              key={work.id}
              title={work.title}
              href={detailPath.work(work.slug)}
              category={work.category}
              thumbnailUrl={work.thumbnailUrl}
            />
          ))}
        </div>
      )}
    </motion.section>
  )
}
