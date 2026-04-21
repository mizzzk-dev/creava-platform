import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getSiteSettings } from '@/modules/settings/api'
import FanclubGuard from '@/components/guards/FanclubGuard'
import { useStrapiCollection, useContentAccess, useCurrentUser, useStrapiSingle } from '@/hooks'
import { getFanclubList } from '@/modules/fanclub/api'
import PageHead from '@/components/seo/PageHead'
import { ROUTES } from '@/lib/routeConstants'
import SkeletonListItem from '@/components/common/SkeletonListItem'
import type { FanclubContent } from '@/types'
import { getHistoryByKind } from '@/modules/store/lib/commerceOptimization'

import FanclubHeroSection from '@/modules/fanclub/sections/FanclubHeroSection'
import FanclubFilterBar, {
  type FanclubCategory,
} from '@/modules/fanclub/sections/FanclubFilterBar'
import FanclubWeeklyUpdates from '@/modules/fanclub/sections/FanclubWeeklyUpdates'
import FanclubRecentlyViewed from '@/modules/fanclub/sections/FanclubRecentlyViewed'
import FanclubContentList from '@/modules/fanclub/sections/FanclubContentList'
import FanclubBenefitsSection from '@/modules/fanclub/sections/FanclubBenefitsSection'
import FanclubShortcuts from '@/modules/fanclub/sections/FanclubShortcuts'
import CmsVisualShowcaseSection from '@/components/common/CmsVisualShowcaseSection'
import UserLifecycleBanner from '@/components/common/UserLifecycleBanner'
import MemberValueExperiencePanel from '@/components/common/MemberValueExperiencePanel'
import MemberProgressHub from '@/components/common/MemberProgressHub'
import CampaignPersonalizationPanel from '@/components/common/CampaignPersonalizationPanel'

export default function FanclubPage() {
  const { t, i18n } = useTranslation()
  const { user, lifecycle } = useCurrentUser()
  const { item: settings } = useStrapiSingle(() =>
    getSiteSettings({ locale: i18n.resolvedLanguage }),
  )

  return (
    <div className="min-h-screen">
      <PageHead title={t('nav.fanclub')} description={t('seo.fanclub')} noindex />
      <FanclubHeroSection />
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <UserLifecycleBanner user={user} lifecycle={lifecycle} context="fc" />
      </div>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:py-14">
        <CmsVisualShowcaseSection
          site="fanclub"
          settings={settings}
          primaryCta={{ label: t('nav.member', { defaultValue: 'マイページ' }), to: ROUTES.MEMBER }}
        />
        <MemberValueExperiencePanel sourceSite="fc" />
        <MemberProgressHub sourceSite="fc" />
        <CampaignPersonalizationPanel sourceSite="fc" />
        <FanclubGuard>
          <FanclubContentSections />
        </FanclubGuard>
      </div>
    </div>
  )
}

function FanclubContentSections() {
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
    return (
      <ul className="divide-y divide-[var(--ds-color-border-subtle)]">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </ul>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-900/40 dark:bg-red-950/30">
        <p className="text-sm font-medium text-red-600 dark:text-red-300">{t('common.error')}</p>
        <p className="mt-1 font-mono text-xs text-red-400 dark:text-red-200">{error}</p>
      </div>
    )
  }

  if (visibleItems !== null && visibleItems.length === 0) {
    return (
      <div className="space-y-6">
        <FanclubBenefitsSection />
        <p className="rounded-xl border border-dashed border-[var(--ds-color-border-default)] px-5 py-8 text-center text-sm text-[var(--ds-color-fg-subtle)]">
          {t('access.noContent')}
        </p>
        <FanclubShortcuts />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FanclubFilterBar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        resultCount={filteredItems.length}
      />

      <FanclubWeeklyUpdates items={weeklyUpdates} />

      <FanclubBenefitsSection />

      <FanclubRecentlyViewed items={recentViewed} />

      <FanclubContentList items={filteredItems} />

      <FanclubShortcuts />
    </div>
  )
}
