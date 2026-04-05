import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useStrapiCollection, useContentAccess } from '@/hooks'
import { getNewsList } from '@/modules/news/api'
import { formatDate } from '@/utils'
import { detailPath } from '@/lib/routeConstants'
import { ROUTES } from '@/lib/routeConstants'
import { SITE_URL } from '@/lib/seo'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import Badge from '@/components/common/Badge'
import SkeletonListItem from '@/components/common/SkeletonListItem'
import ErrorState from '@/components/common/ErrorState'
import SnsLinks from '@/components/common/SnsLinks'
import type { NewsItem } from '@/types'

export default function NewsPage() {
  const { t } = useTranslation()
  const { filterVisible } = useContentAccess()

  const { items, loading, error, refetch } = useStrapiCollection<NewsItem>(
    () => getNewsList({ pagination: { pageSize: 16, withCount: false } }),
  )

  // 閲覧不可コンテンツを除外（fc_only / 期限切れ limited）
  const visibleItems = items ? filterVisible(items) : null

  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <PageHead title={t('nav.news')} description={t('seo.news')} />
      <StructuredData
        schema={{
          type: 'BreadcrumbList',
          items: [
            { name: 'Home', url: SITE_URL },
            { name: t('nav.news'), url: `${SITE_URL}${ROUTES.NEWS}` },
          ],
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
          news
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          {t('nav.news')}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t('seo.news')}
        </p>
      </motion.div>

      <div className="mt-12">
        {loading && (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonListItem key={i} />
            ))}
          </ul>
        )}

        {error && (
          <ErrorState message={error} onRetry={refetch} />
        )}

        {!loading && !error && visibleItems !== null && visibleItems.length === 0 && (
          <p className="font-mono text-sm text-gray-300 dark:text-gray-700">{t('access.noContent')}</p>
        )}

        {visibleItems && visibleItems.length > 0 && (
          <motion.ul
            className="divide-y divide-gray-100 dark:divide-gray-800/60"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          >
            {visibleItems.map((item) => (
              <motion.li
                key={item.id}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
                }}
                className="py-5"
              >
                <Link
                  to={detailPath.news(item.slug)}
                  className="group flex items-start gap-5"
                >
                  {/* 日付カラム */}
                  {item.publishAt && (
                    <div className="hidden sm:block shrink-0 w-20 text-right pt-0.5">
                      <time
                        dateTime={item.publishAt}
                        className="font-mono text-[11px] leading-tight text-gray-400 dark:text-gray-600"
                      >
                        {new Date(item.publishAt).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </time>
                    </div>
                  )}

                  {/* コンテンツカラム */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.accessStatus === 'fc_only' && <Badge variant="fc" size="sm" />}
                      {item.accessStatus === 'limited' && <Badge variant="limited" size="sm" />}
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </p>
                    </div>

                    {/* モバイルでは日付をタイトル下に */}
                    {item.publishAt && (
                      <p className="sm:hidden mt-1 font-mono text-[10px] text-gray-400 dark:text-gray-600">
                        {formatDate(item.publishAt)}
                      </p>
                    )}
                  </div>

                  {/* 矢印 */}
                  <span className="shrink-0 pt-0.5 font-mono text-[11px] text-gray-200 dark:text-gray-800 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-gray-400 dark:group-hover:text-gray-600">
                    →
                  </span>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>

      {/* SNS follow links */}
      <SnsLinks />
    </section>
  )
}
