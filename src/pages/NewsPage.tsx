import { useTranslation } from 'react-i18next'
import { useStrapiCollection, useContentAccess } from '@/hooks'
import { getNewsList } from '@/modules/news/api'
import { formatDate } from '@/utils'
import type { NewsItem } from '@/types'

export default function NewsPage() {
  const { t } = useTranslation()
  const { filterVisible } = useContentAccess()

  const { items, loading, error } = useStrapiCollection<NewsItem>(
    () => getNewsList({ pagination: { pageSize: 20 } }),
  )

  // 閲覧不可コンテンツを除外（fc_only / 期限切れ limited）
  const visibleItems = items ? filterVisible(items) : null

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        {t('nav.news')}
      </h1>

      <div className="mt-10">
        {loading && (
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        )}

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-600">{t('common.error')}</p>
            <p className="mt-1 font-mono text-xs text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && visibleItems !== null && visibleItems.length === 0 && (
          <p className="text-sm text-gray-400">{t('access.noContent')}</p>
        )}

        {visibleItems && visibleItems.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {visibleItems.map((item) => (
              <li key={item.id} className="py-4">
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                {item.publishAt && (
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(item.publishAt)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
