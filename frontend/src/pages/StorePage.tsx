import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProductList } from '@/modules/store/hooks/useProductList'
import { useContentAccess, useStrapiSingle } from '@/hooks'
import { getSiteSettings } from '@/modules/settings/api'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import { ROUTES } from '@/lib/routeConstants'
import { SITE_URL } from '@/lib/seo'
import { useListPageWebVitals } from '@/modules/analytics/webVitals'
import { useDisplayCurrency } from '@/modules/store/hooks/useDisplayCurrency'
import { getRankedProducts, type RankingRange } from '@/modules/store/lib/ranking'
import {
  forecastStockout,
  getAbVariant,
  getHistoryByKind,
} from '@/modules/store/lib/commerceOptimization'

import StoreHeroSection from '@/modules/store/sections/StoreHeroSection'
import StoreFilterBar, {
  type StatusFilter,
  type SortOption,
  type StoreRegion,
} from '@/modules/store/sections/StoreFilterBar'
import StoreEditorialPickup from '@/modules/store/sections/StoreEditorialPickup'
import StoreRankingSection from '@/modules/store/sections/StoreRankingSection'
import StoreStockoutAlert from '@/modules/store/sections/StoreStockoutAlert'
import StoreStatusGuide from '@/modules/store/sections/StoreStatusGuide'
import StoreGuideLinks from '@/modules/store/sections/StoreGuideLinks'
import StoreProductGrid from '@/modules/store/sections/StoreProductGrid'
import StoreFooterCta from '@/modules/store/sections/StoreFooterCta'

export default function StorePage() {
  const { t, i18n } = useTranslation()
  useListPageWebVitals('store-list')
  const { products, loading, error } = useProductList(24)
  const { filterVisible } = useContentAccess()
  const { item: settings } = useStrapiSingle(() =>
    getSiteSettings({ locale: i18n.resolvedLanguage }),
  )
  const { currency, updateCurrency } = useDisplayCurrency('JPY')
  const [rankingRange, setRankingRange] = useState<RankingRange>('7d')
  const [region, setRegion] = useState<StoreRegion>('JP')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTag] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('recommended')
  const [hideSoldOut, setHideSoldOut] = useState(false)

  const visibleProducts = filterVisible(products)
  const heroVariant = useMemo(() => getAbVariant('storeHero') as 'A' | 'B', [])
  const rankingVariant = useMemo(() => getAbVariant('storeRanking') as 'A' | 'B', [])
  const ctaVariant = useMemo(() => getAbVariant('storeCta') as 'A' | 'B', [])
  const rankingProducts = getRankedProducts(visibleProducts, rankingRange, 5)
  const categories = useMemo(
    () => ['all', ...new Set(visibleProducts.map((p) => p.category).filter(Boolean))],
    [visibleProducts],
  )
  const recentSlugs = useMemo(() => new Set(getHistoryByKind('product').slice(0, 10)), [])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const base = visibleProducts.filter((p) => {
      if (statusFilter !== 'all' && p.purchaseStatus !== statusFilter) return false
      if (hideSoldOut && p.purchaseStatus === 'soldout') return false
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false
      if (selectedTag !== 'all' && !p.tags.includes(selectedTag)) return false
      if (!normalizedQuery) return true
      return `${p.title} ${p.category} ${p.tags.join(' ')}`.toLowerCase().includes(normalizedQuery)
    })

    if (sortBy === 'newest') return [...base].sort((a, b) => Number(b.isNewArrival) - Number(a.isNewArrival) || a.sortOrder - b.sortOrder)
    if (sortBy === 'priceAsc') return [...base].sort((a, b) => a.price - b.price)
    if (sortBy === 'priceDesc') return [...base].sort((a, b) => b.price - a.price)
    return [...base].sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        Number(b.isNewArrival) - Number(a.isNewArrival) ||
        a.sortOrder - b.sortOrder,
    )
  }, [hideSoldOut, query, selectedCategory, selectedTag, sortBy, statusFilter, visibleProducts])

  const featuredProducts = filteredProducts.filter((p) => p.featured).slice(0, 4)
  const newArrivals = useMemo(
    () =>
      filteredProducts
        .filter((p) => p.isNewArrival && p.purchaseStatus === 'available')
        .slice(0, 4),
    [filteredProducts],
  )
  const limitedProducts = useMemo(
    () =>
      filteredProducts
        .filter((p) => (p.isLimited || p.campaignType === 'drop') && p.purchaseStatus !== 'soldout')
        .slice(0, 4),
    [filteredProducts],
  )
  const viewedProducts = filteredProducts.filter((p) => recentSlugs.has(p.slug)).slice(0, 4)

  const stockoutForecast = forecastStockout(
    visibleProducts.slice(0, 3).map((p, i) => ({
      productId: p.id,
      productTitle: p.title,
      stockUnits: 30 - i * 8,
      soldUnitsLast7d: 10 + i * 4,
      restockLeadDays: 14,
      notifyWaitlist: 12 + i * 3,
    })),
  )

  const handleResetFilters = useCallback(() => {
    setStatusFilter('all')
    setQuery('')
    setSelectedCategory('all')
    setSortBy('recommended')
    setHideSoldOut(false)
  }, [])

  return (
    <div className="min-h-screen">
      <PageHead
        title={t('store.title')}
        description={t('seo.store', {
          defaultValue: '作品販売と制作依頼の両方にアクセスできるストアページ。限定商品と依頼導線をまとめて案内します。',
        })}
      />
      <StructuredData
        schema={{
          type: 'BreadcrumbList',
          items: [
            { name: 'Home', url: SITE_URL },
            { name: t('store.title'), url: `${SITE_URL}${ROUTES.STORE}` },
          ],
        }}
      />

      <StoreHeroSection
        products={visibleProducts}
        region={region}
        heroVariant={heroVariant}
        ctaVariant={ctaVariant}
        settings={settings}
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 space-y-8">
        <StoreFilterBar
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          hideSoldOut={hideSoldOut}
          onHideSoldOutChange={setHideSoldOut}
          query={query}
          onQueryChange={setQuery}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          selectedCategory={selectedCategory}
          onSelectedCategoryChange={setSelectedCategory}
          categories={categories}
          currency={currency}
          onCurrencyChange={updateCurrency}
          region={region}
          onRegionChange={setRegion}
          resultCount={filteredProducts.length}
        />

        <StoreEditorialPickup
          title={t('store.featuredTitle', { defaultValue: '特集ピックアップ' })}
          subtitle={t('store.featuredSubtitle', { defaultValue: '今、編集部が推したい商品' })}
          products={featuredProducts}
          currency={currency}
          accent="violet"
          itemKeyPrefix="featured"
          trackingLocation="store_featured"
        />

        <StoreEditorialPickup
          title={t('store.newArrivalsTitle', { defaultValue: '新着アイテム' })}
          subtitle={t('store.newArrivalsSubtitle', { defaultValue: '入荷したばかりの最新ラインナップ' })}
          products={newArrivals}
          currency={currency}
          accent="violet"
          itemKeyPrefix="new"
          trackingLocation="store_new_arrivals"
        />

        <StoreEditorialPickup
          title={t('store.limitedTitle', { defaultValue: '限定 / ドロップ' })}
          subtitle={t('store.limitedSubtitle', { defaultValue: '期間・数量限定のスペシャルアイテム' })}
          products={limitedProducts}
          currency={currency}
          accent="violet"
          itemKeyPrefix="limited"
          trackingLocation="store_limited"
        />

        <StoreEditorialPickup
          title={t('store.recentlyViewed', { defaultValue: '最近見た商品' })}
          products={viewedProducts}
          currency={currency}
          accent="subtle"
          itemKeyPrefix="viewed"
          trackingLocation="store_recently_viewed"
        />

        <StoreRankingSection
          products={rankingProducts}
          range={rankingRange}
          onRangeChange={setRankingRange}
          variant={rankingVariant}
        />

        <StoreStockoutAlert forecasts={stockoutForecast} />

        <StoreStatusGuide />

        <StoreProductGrid
          products={filteredProducts}
          loading={loading}
          error={error}
          currency={currency}
          totalCount={visibleProducts.length}
          onResetFilters={handleResetFilters}
        />

        {!loading && <StoreGuideLinks />}

        {!loading && <StoreFooterCta />}
      </div>
    </div>
  )
}
