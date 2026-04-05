import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef } from 'react'
import { useStrapiCollection, useContentAccess } from '@/hooks'
import { getBlogList } from '@/modules/blog/api'
import { formatDate } from '@/utils'
import { detailPath } from '@/lib/routeConstants'
import PageHead from '@/components/seo/PageHead'
import SkeletonListItem from '@/components/common/SkeletonListItem'
import ErrorState from '@/components/common/ErrorState'
import type { BlogPost } from '@/types'

export default function BlogPage() {
  const { t } = useTranslation()
  const { filterVisible } = useContentAccess()
  const softRetried = useRef(false)

  const { items, loading, error, refetch } = useStrapiCollection<BlogPost>(
    () => getBlogList({ pagination: { pageSize: 12, withCount: false } }),
  )

  useEffect(() => {
    if (!error || softRetried.current) return
    softRetried.current = true
    const timer = setTimeout(() => {
      refetch()
    }, 1200)
    return () => clearTimeout(timer)
  }, [error, refetch])

  const visibleItems = items ? filterVisible(items) : null

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <PageHead title={t('nav.blog')} description={t('seo.blog')} />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
        {t('nav.blog')}
      </h1>

      <div className="mt-10">
        {loading && (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonListItem key={i} />
            ))}
          </ul>
        )}

        {error && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && visibleItems !== null && visibleItems.length === 0 && (
          <p className="text-sm text-gray-400">{t('access.noContent')}</p>
        )}

        {visibleItems && visibleItems.length > 0 && (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {visibleItems.map((item) => (
              <li key={item.id} className="py-4">
                <Link to={detailPath.blog(item.slug)} className="group block">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                    {item.title}
                  </p>
                  {item.publishAt && (
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-600">
                      {formatDate(item.publishAt)}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
