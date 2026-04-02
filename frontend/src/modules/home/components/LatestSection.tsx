import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useHomeLatest } from '@/modules/home/hooks/useHomeLatest'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import SectionHeader from '@/components/common/SectionHeader'
import ContentCard from '@/components/cards/ContentCard'

export default function LatestSection() {
  const { t } = useTranslation()
  const { news, blog, events } = useHomeLatest()

  const categories = [
    {
      key: 'news',
      label: t('home.latest.news'),
      data: news,
      viewAllTo: ROUTES.NEWS,
      toHref: (slug: string) => detailPath.news(slug),
    },
    {
      key: 'blog',
      label: t('home.latest.blog'),
      data: blog,
      viewAllTo: ROUTES.BLOG,
      toHref: (slug: string) => detailPath.blog(slug),
    },
    {
      key: 'events',
      label: t('home.latest.events'),
      data: events,
      viewAllTo: ROUTES.EVENTS,
      toHref: (slug: string) => detailPath.event(slug),
    },
  ]

  return (
    <motion.section
      className="mx-auto max-w-5xl px-4 py-20"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <SectionHeader label={t('home.latest.title')} />

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-3">
        {categories.map(({ key, label, data, viewAllTo, toHref }) => (
          <div key={key}>
            <SectionHeader label={label} viewAllTo={viewAllTo} />

            {data.loading && (
              <p className="mt-4 font-mono text-[11px] text-gray-300">{t('common.loading')}</p>
            )}

            {!data.loading && data.items.length === 0 && (
              <p className="mt-4 font-mono text-[11px] text-gray-300">{t('home.latest.empty')}</p>
            )}

            {data.items.slice(0, 3).map((item) => (
              <ContentCard
                key={item.id}
                title={item.title}
                href={toHref(item.slug)}
                publishAt={item.publishAt}
              />
            ))}
          </div>
        ))}
      </div>
    </motion.section>
  )
}
