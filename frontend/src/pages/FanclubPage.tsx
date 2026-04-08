import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FanclubGuard from '@/components/guards/FanclubGuard'
import { useStrapiCollection, useContentAccess } from '@/hooks'
import { getFanclubList } from '@/modules/fanclub/api'
import { formatDate } from '@/utils'
import { detailPath, ROUTES } from '@/lib/routeConstants'
import PageHead from '@/components/seo/PageHead'
import SkeletonListItem from '@/components/common/SkeletonListItem'
import type { FanclubContent } from '@/types'
import { getHistoryByKind, trackViewHistory } from '@/modules/store/lib/commerceOptimization'
import { trackEvent } from '@/modules/analytics'

const CATEGORY_KEYS = ['all', 'diary', 'exclusive', 'qa', 'behind_scenes', 'teaser', 'live_archive', 'tips', 'info'] as const

type FanclubCategory = (typeof CATEGORY_KEYS)[number]

export default function FanclubPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <PageHead title={t('nav.fanclub')} description={t('seo.fanclub')} noindex />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{t('nav.fanclub')}</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('fanclub.pageLead', { defaultValue: '今週の更新・限定公開・会員向け導線をまとめて確認できます。' })}</p>
      <Link to={ROUTES.MEMBER} className="mt-3 inline-flex text-xs font-mono text-violet-500 hover:text-violet-400">{t('nav.member', { defaultValue: 'member' })} →</Link>

      <div className="mt-10">
        <FanclubGuard>
          <FanclubContentList />
        </FanclubGuard>
      </div>
    </section>
  )
}

function FanclubContentList() {
  const { t } = useTranslation()
  const { filterVisible } = useContentAccess()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<FanclubCategory>('all')

  const { items, loading, error } = useStrapiCollection<FanclubContent>(
    () => getFanclubList({ pagination: { pageSize: 20 } }),
  )

  const visibleItems = items ? filterVisible(items) : null
  const recentSlugs = useMemo(() => new Set(getHistoryByKind('blog').slice(0, 10)), [])

  const filteredItems = useMemo(() => {
    if (!visibleItems) return []
    const q = query.trim().toLowerCase()
    return visibleItems.filter((item) => {
      const itemCategory = (item as FanclubContent & { category?: string }).category ?? 'diary'
      if (category !== 'all' && itemCategory !== category) return false
      if (!q) return true
      return `${item.title} ${itemCategory}`.toLowerCase().includes(q)
    })
  }, [category, query, visibleItems])

  const weeklyUpdates = filteredItems.slice(0, 3)
  const recentViewed = filteredItems.filter((item) => recentSlugs.has(item.slug)).slice(0, 3)

  if (loading) {
    return <ul className="divide-y divide-gray-100 dark:divide-gray-800">{Array.from({ length: 6 }).map((_, i) => <SkeletonListItem key={i} />)}</ul>
  }

  if (error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/30">
        <p className="text-sm font-medium text-red-600 dark:text-red-300">{t('common.error')}</p>
        <p className="mt-1 font-mono text-xs text-red-400 dark:text-red-200">{error}</p>
      </div>
    )
  }

  if (visibleItems !== null && visibleItems.length === 0) {
    return <p className="text-sm text-gray-400">{t('access.noContent')}</p>
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:grid-cols-2">
        <label className="text-xs text-gray-500 dark:text-gray-400">
          {t('fanclub.searchLabel', { defaultValue: 'コンテンツ検索' })}
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('fanclub.searchPlaceholder', { defaultValue: 'タイトルで検索' })} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
        </label>
        <label className="text-xs text-gray-500 dark:text-gray-400">
          {t('fanclub.filterCategory', { defaultValue: 'カテゴリ' })}
          <select value={category} onChange={(event) => setCategory(event.target.value as FanclubCategory)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
            {CATEGORY_KEYS.map((key) => (
              <option key={key} value={key}>{t(`fanclub.category.${key}`, { defaultValue: key === 'all' ? 'すべて' : key })}</option>
            ))}
          </select>
        </label>
      </div>

      {weeklyUpdates.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950">
          <p className="font-mono text-[10px] uppercase tracking-wider text-violet-500">{t('fanclub.weeklyUpdates', { defaultValue: '今週の更新' })}</p>
          <ul className="mt-2 space-y-2">
            {weeklyUpdates.map((item) => (
              <li key={`weekly-${item.id}`} className="rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800">
                <Link to={detailPath.fanclub(item.slug)} className="font-medium text-gray-900 transition hover:text-violet-500 dark:text-gray-100">{item.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recentViewed.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950">
          <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-500">{t('fanclub.recentlyViewed', { defaultValue: '最近見たコンテンツ' })}</p>
          <ul className="mt-2 space-y-2">
            {recentViewed.map((item) => (
              <li key={`recent-${item.id}`} className="rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800">
                <Link to={detailPath.fanclub(item.slug)} className="font-medium text-gray-900 transition hover:text-violet-500 dark:text-gray-100">{item.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {filteredItems.length === 0 && <p className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700">{t('fanclub.emptyFiltered', { defaultValue: '条件に合うコンテンツがありません。検索条件を変更してください。' })}</p>}

      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {filteredItems.map((item) => (
          <li key={item.id} className="py-4">
            <Link
              to={detailPath.fanclub(item.slug)}
              className="group block"
              onClick={() => {
                trackViewHistory('blog', item.slug)
                trackEvent('fanclub_content_click', { slug: item.slug })
              }}
            >
              <p className="text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-600 dark:text-gray-100 dark:group-hover:text-gray-300">{item.title}</p>
              {item.publishAt && <p className="mt-1 text-xs text-gray-400">{formatDate(item.publishAt)}</p>}
            </Link>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('fanclub.ctaLead', { defaultValue: '会員導線のショートカット' })}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={ROUTES.MEMBER} className="rounded-full border border-violet-300 px-3 py-1 text-xs text-violet-600 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/30">{t('nav.member')} →</Link>
          <Link to={ROUTES.STORE} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300">{t('nav.store')} →</Link>
          <Link to={ROUTES.NEWS} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300">{t('nav.news')} →</Link>
        </div>
      </div>
    </div>
  )
}
