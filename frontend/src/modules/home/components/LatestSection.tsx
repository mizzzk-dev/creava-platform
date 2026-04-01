import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useHomeLatest } from '@/modules/home/hooks/useHomeLatest'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import ContentCard from '@/components/cards/ContentCard'

/** セクションタイトル with モノスペース prefix */
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10px] text-gray-300 select-none">//</span>
      <span className="font-mono text-xs uppercase tracking-wider text-gray-400">{label}</span>
    </div>
  )
}

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
      viewAllTo: ROUTES.NEWS,
      toHref: (slug: string) => detailPath.news(slug),
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
      {/* section header */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gray-300" />
        </span>
        <h2 className="font-mono text-xs uppercase tracking-wider text-gray-400">
          {t('home.latest.title')}
        </h2>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-3">
        {categories.map(({ key, label, data, viewAllTo, toHref }) => (
          <div key={key}>
            <div className="flex items-baseline justify-between">
              <SectionLabel label={label} />
              <Link
                to={viewAllTo}
                className="font-mono text-[10px] text-gray-300 transition-colors hover:text-gray-600"
              >
                all →
              </Link>
            </div>

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
