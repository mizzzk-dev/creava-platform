import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useHomeLatest } from '@/modules/home/hooks/useHomeLatest'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import SectionHeader from '@/components/common/SectionHeader'
import ContentCard from '@/components/cards/ContentCard'
import type { Event } from '@/types/content'

function SkeletonRows() {
  return (
    <div className="mt-3 space-y-3.5">
      {[80, 65, 90].map((w, i) => (
        <div key={i} className="border-t border-gray-100 pt-3.5">
          <div className={`skeleton h-2.5 rounded`} style={{ width: `${w}%` }} />
          <div className="skeleton mt-2 h-2 w-20 rounded" />
        </div>
      ))}
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
      emptyMessage: t('home.latest.emptyNews'),
      data: news,
      viewAllTo: ROUTES.NEWS,
      renderCard: (item: { id: number; title: string; slug: string; publishAt: string | null; accessStatus: 'public' | 'fc_only' | 'limited' }) => (
        <ContentCard
          key={item.id}
          title={item.title}
          href={detailPath.news(item.slug)}
          publishAt={item.publishAt}
          status={item.accessStatus}
        />
      ),
    },
    {
      key: 'blog',
      label: t('home.latest.blog'),
      emptyMessage: t('home.latest.emptyBlog'),
      data: blog,
      viewAllTo: ROUTES.BLOG,
      renderCard: (item: { id: number; title: string; slug: string; publishAt: string | null; accessStatus: 'public' | 'fc_only' | 'limited' }) => (
        <ContentCard
          key={item.id}
          title={item.title}
          href={detailPath.blog(item.slug)}
          publishAt={item.publishAt}
          status={item.accessStatus}
        />
      ),
    },
    {
      key: 'events',
      label: t('home.latest.events'),
      emptyMessage: t('home.latest.emptyEvents'),
      data: events,
      viewAllTo: ROUTES.EVENTS,
      renderCard: (item: Event) => (
        <ContentCard
          key={item.id}
          title={item.title}
          href={detailPath.event(item.slug)}
          startAt={item.startAt}
          venue={item.venue}
          status={item.accessStatus}
        />
      ),
    },
  ] as const

  return (
    <motion.section
      className="mx-auto max-w-5xl px-4 py-20"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <SectionHeader label={t('home.latest.title')} />

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-0">
        {categories.map(({ key, label, emptyMessage, data, viewAllTo, renderCard }, colIdx) => (
          <div
            key={key}
            className={colIdx < 2 ? 'md:border-r md:border-gray-100 md:pr-8' : 'md:pl-8'}
          >
            {/* column header */}
            <div className={colIdx > 0 ? 'md:pl-0' : ''}>
              <SectionHeader label={label} viewAllTo={viewAllTo} />
            </div>

            {/* loading skeleton */}
            {data.loading && <SkeletonRows />}

            {/* empty */}
            {!data.loading && data.items.length === 0 && (
              <p className="mt-4 font-mono text-[11px] text-gray-300">{emptyMessage}</p>
            )}

            {/* items */}
            {!data.loading &&
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (data.items as any[]).slice(0, 3).map((item) => renderCard(item))}
          </div>
        ))}
      </div>
    </motion.section>
  )
}
