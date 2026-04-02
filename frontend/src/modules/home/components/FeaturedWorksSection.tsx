import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useStrapiCollection } from '@/hooks'
import { getWorksList } from '@/modules/works/api'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import SectionHeader from '@/components/common/SectionHeader'
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
      <SectionHeader label={t('home.works.title')} viewAllTo={ROUTES.WORKS} viewAllLabel={t('home.works.viewAll')} />

      {loading && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse bg-gray-100" />
          ))}
        </div>
      )}

      {!loading && featured.length === 0 && (
        <p className="mt-8 font-mono text-[11px] text-gray-300">{t('access.noContent')}</p>
      )}

      {featured.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.slice(0, 4).map((work, i) => (
            <WorkCard
              key={work.id}
              title={work.title}
              href={detailPath.work(work.slug)}
              category={work.category}
              thumbnailUrl={work.thumbnailUrl}
              index={i}
            />
          ))}
        </div>
      )}
    </motion.section>
  )
}
