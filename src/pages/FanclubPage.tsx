import { useTranslation } from 'react-i18next'
import FanclubGuard from '@/components/guards/FanclubGuard'
import { useStrapiCollection, useContentAccess } from '@/hooks'
import { getFanclubList } from '@/modules/fanclub/api'
import { formatDate } from '@/utils'
import type { FanclubContent } from '@/types'

export default function FanclubPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        {t('nav.fanclub')}
      </h1>

      <div className="mt-10">
        <FanclubGuard>
          <FanclubContentList />
        </FanclubGuard>
      </div>
    </section>
  )
}

/**
 * ガード通過後に描画するコンテンツリスト
 * この時点で role = member | admin が保証されている
 */
function FanclubContentList() {
  const { t } = useTranslation()
  const { filterVisible } = useContentAccess()

  const { items, loading, error } = useStrapiCollection<FanclubContent>(
    () => getFanclubList({ pagination: { pageSize: 20 } }),
  )

  const visibleItems = items ? filterVisible(items) : null

  if (loading) {
    return <p className="text-sm text-gray-400">{t('common.loading')}</p>
  }

  if (error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-sm font-medium text-red-600">{t('common.error')}</p>
        <p className="mt-1 font-mono text-xs text-red-400">{error}</p>
      </div>
    )
  }

  if (visibleItems !== null && visibleItems.length === 0) {
    return <p className="text-sm text-gray-400">{t('access.noContent')}</p>
  }

  return (
    <ul className="divide-y divide-gray-100">
      {visibleItems?.map((item) => (
        <li key={item.id} className="py-4">
          <p className="text-sm font-medium text-gray-900">{item.title}</p>
          {item.publishAt && (
            <p className="mt-1 text-xs text-gray-400">{formatDate(item.publishAt)}</p>
          )}
        </li>
      ))}
    </ul>
  )
}
