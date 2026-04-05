import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import FanclubGuard from '@/components/guards/FanclubGuard'
import { useStrapiCollection, useContentAccess } from '@/hooks'
import { getFanclubList } from '@/modules/fanclub/api'
import { formatDate } from '@/utils'
import { detailPath, ROUTES } from '@/lib/routeConstants'
import PageHead from '@/components/seo/PageHead'
import SkeletonListItem from '@/components/common/SkeletonListItem'
import type { FanclubContent } from '@/types'

export default function FanclubPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <PageHead title={t('nav.fanclub')} description={t('seo.fanclub')} noindex />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        {t('nav.fanclub')}
      </h1>
      <Link to={ROUTES.MEMBER} className="mt-3 inline-flex text-xs font-mono text-violet-500 hover:text-violet-400">
        {t('nav.member', { defaultValue: 'member' })} →
      </Link>

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
    return (
      <ul className="divide-y divide-gray-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </ul>
    )
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
          <Link
            to={detailPath.fanclub(item.slug)}
            className="group block"
          >
            <p className="text-sm font-medium text-gray-900 group-hover:text-gray-600 transition-colors">
              {item.title}
            </p>
            {item.publishAt && (
              <p className="mt-1 text-xs text-gray-400">{formatDate(item.publishAt)}</p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
