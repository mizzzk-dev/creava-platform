import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useProductList } from '@/modules/store/hooks/useProductList'
import { useContentAccess } from '@/hooks'
import ProductCard from '@/modules/store/components/ProductCard'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import SkeletonProductCard from '@/components/common/SkeletonProductCard'
import { ROUTES } from '@/lib/routeConstants'
import Badge from '@/components/common/Badge'
import { SITE_URL } from '@/lib/seo'
import { useListPageWebVitals } from '@/modules/analytics/webVitals'
import { DISPLAY_CURRENCIES } from '@/modules/store/lib/currency'
import { useDisplayCurrency } from '@/modules/store/hooks/useDisplayCurrency'
import { getRankedProducts, type RankingRange } from '@/modules/store/lib/ranking'
import { forecastStockout, getAbVariant, getHistoryByKind, getRegionCommercePolicy } from '@/modules/store/lib/commerceOptimization'
import { trackEvent } from '@/modules/analytics'

const STATUS_FILTERS = ['all', 'available', 'coming_soon', 'soldout'] as const
const SORT_OPTIONS = ['recommended', 'newest', 'priceAsc', 'priceDesc'] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]
type SortOption = (typeof SORT_OPTIONS)[number]

export default function StorePage() {
  const { t } = useTranslation()
  useListPageWebVitals('store-list')
  const { products, loading, error } = useProductList(24)
  const { filterVisible } = useContentAccess()
  const { currency, updateCurrency } = useDisplayCurrency('JPY')
  const [rankingRange, setRankingRange] = useState<RankingRange>('7d')
  const [region, setRegion] = useState<'JP' | 'US' | 'EU' | 'ROW'>('JP')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTag, setSelectedTag] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('recommended')
  const [hideSoldOut, setHideSoldOut] = useState(false)

  const visibleProducts = filterVisible(products)
  const heroVariant = useMemo(() => getAbVariant('storeHero'), [])
  const rankingVariant = useMemo(() => getAbVariant('storeRanking'), [])
  const ctaVariant = useMemo(() => getAbVariant('storeCta'), [])
  const regionPolicy = getRegionCommercePolicy(region)
  const rankingProducts = getRankedProducts(visibleProducts, rankingRange, 3)
  const categories = useMemo(() => ['all', ...new Set(visibleProducts.map((product) => product.category).filter(Boolean))], [visibleProducts])
  const tags = useMemo(() => ['all', ...new Set(visibleProducts.flatMap((product) => product.tags).filter(Boolean))], [visibleProducts])
  const recentSlugs = useMemo(() => new Set(getHistoryByKind('product').slice(0, 10)), [])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const base = visibleProducts.filter((product) => {
      if (statusFilter !== 'all' && product.purchaseStatus !== statusFilter) return false
      if (hideSoldOut && product.purchaseStatus === 'soldout') return false
      if (selectedCategory !== 'all' && product.category !== selectedCategory) return false
      if (selectedTag !== 'all' && !product.tags.includes(selectedTag)) return false
      if (!normalizedQuery) return true
      return `${product.title} ${product.category} ${product.tags.join(' ')}`.toLowerCase().includes(normalizedQuery)
    })

    if (sortBy === 'newest') {
      return [...base].sort((a, b) => Number(b.isNewArrival) - Number(a.isNewArrival) || a.sortOrder - b.sortOrder)
    }
    if (sortBy === 'priceAsc') {
      return [...base].sort((a, b) => a.price - b.price)
    }
    if (sortBy === 'priceDesc') {
      return [...base].sort((a, b) => b.price - a.price)
    }
    return [...base].sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.isNewArrival) - Number(a.isNewArrival) || a.sortOrder - b.sortOrder)
  }, [hideSoldOut, query, selectedCategory, selectedTag, sortBy, statusFilter, visibleProducts])

  const featuredProducts = filteredProducts.filter((product) => product.featured).slice(0, 4)
  const viewedProducts = filteredProducts.filter((product) => recentSlugs.has(product.slug)).slice(0, 4)

  const stockoutForecast = forecastStockout(visibleProducts.slice(0, 3).map((product, index) => ({
    productId: product.id,
    productTitle: product.title,
    stockUnits: 30 - index * 8,
    soldUnitsLast7d: 10 + index * 4,
    restockLeadDays: 14,
    notifyWaitlist: 12 + index * 3,
  })))

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16 lg:py-20">
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

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-900 px-6 py-8 text-white dark:border-gray-700 sm:px-8 sm:py-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.3),transparent_46%)]" />
            <p className="relative font-mono text-[11px] uppercase tracking-[0.2em] text-violet-200">mizzz official store</p>
            <h1 className="relative mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t('store.title')}</h1>
            <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-violet-100/90">
              {heroVariant === 'A'
                ? t('store.ecHeroCopyA', { defaultValue: '新作ドロップ・限定販売・先行案内を1ページで完結。お気に入りから最短導線で購入できます。' })
                : t('store.ecHeroCopyB', { defaultValue: 'キャンペーン、ランキング、再販通知を統合したEC体験で、欲しいアイテムに最短でアクセスできます。' })}
            </p>
            <div className="relative mt-6 flex flex-wrap gap-3">
              <a href="#store-products" className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-100">
                {ctaVariant === 'A' ? t('store.heroCtaPrimary', { defaultValue: '今すぐ購入する' }) : t('store.heroCtaPrimaryAlt', { defaultValue: '人気商品を見る' })}
              </a>
              <Link to={ROUTES.CART} className="inline-flex items-center rounded-full border border-violet-200/70 px-5 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-violet-100">
                {t('cart.goToCart', { defaultValue: 'カートを見る' })}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white px-5 py-6 dark:border-gray-800 dark:bg-gray-950">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">campaign</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('store.campaignTitle', { defaultValue: '春の限定ドロップ' })}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {t('store.campaignBody', { defaultValue: '期間限定バンドル、会員先行販売、再販通知登録をまとめて案内しています。' })}
            </p>
            <div className="mt-5">
              <Link to={ROUTES.FANCLUB} className="inline-flex items-center text-sm font-semibold text-violet-600 hover:text-violet-500 dark:text-violet-300 dark:hover:text-violet-200">
                {t('store.campaignCta', { defaultValue: '先行販売の詳細を見る' })} →
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 lg:grid-cols-5">
          <label className="text-xs text-gray-500 dark:text-gray-400 lg:col-span-2">
            {t('store.searchLabel', { defaultValue: '商品検索' })}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('store.searchPlaceholder', { defaultValue: '商品名・カテゴリ・タグで検索' })}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </label>
          <label className="text-xs text-gray-500 dark:text-gray-400">
            {t('store.currencyLabel', { defaultValue: '表示通貨' })}
            <select
              value={currency}
              onChange={(event) => updateCurrency(event.target.value as typeof currency)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              {DISPLAY_CURRENCIES.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-500 dark:text-gray-400">
            {t('store.regionLabel', { defaultValue: '配送地域' })}
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value as typeof region)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="JP">JP</option><option value="US">US</option><option value="EU">EU</option><option value="ROW">ROW</option>
            </select>
          </label>
          <div className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {t('store.regionNotice', {
              defaultValue: `通貨:${regionPolicy.currency} / 送料:${regionPolicy.shippingFee} / 税率:${Math.round(regionPolicy.taxRate * 100)}% / 配送:${regionPolicy.canShip ? '可' : '不可'}`,
            })}
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-gray-500 dark:text-gray-400">
            {t('store.sortLabel', { defaultValue: '並び順' })}
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
              <option value="recommended">{t('store.sortRecommended', { defaultValue: 'おすすめ順' })}</option>
              <option value="newest">{t('store.sortNewest', { defaultValue: '新着順' })}</option>
              <option value="priceAsc">{t('store.sortPriceAsc', { defaultValue: '価格が安い順' })}</option>
              <option value="priceDesc">{t('store.sortPriceDesc', { defaultValue: '価格が高い順' })}</option>
            </select>
          </label>
          <label className="text-xs text-gray-500 dark:text-gray-400">
            {t('store.filterCategory', { defaultValue: 'カテゴリ' })}
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
              {categories.map((category) => (
                <option key={category} value={category}>{category === 'all' ? t('store.filterAll', { defaultValue: 'すべて' }) : category}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-500 dark:text-gray-400">
            {t('store.filterTag', { defaultValue: 'タグ' })}
            <select value={selectedTag} onChange={(event) => setSelectedTag(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
              {tags.map((tag) => (
                <option key={tag} value={tag}>{tag === 'all' ? t('store.filterAll', { defaultValue: 'すべて' }) : tag}</option>
              ))}
            </select>
          </label>
          <label className="mt-5 inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <input type="checkbox" checked={hideSoldOut} onChange={(event) => setHideSoldOut(event.target.checked)} />
            {t('store.hideSoldOut', { defaultValue: '完売商品を非表示' })}
          </label>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition ${
                  statusFilter === status
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {status === 'all' && t('store.filterAll', { defaultValue: 'すべて' })}
                {status === 'available' && t('store.filterAvailable', { defaultValue: '販売中' })}
                {status === 'coming_soon' && t('store.filterComingSoon', { defaultValue: '販売準備中' })}
                {status === 'soldout' && t('store.filterSoldOut', { defaultValue: '完売' })}
              </button>
            ))}
          </div>
        </div>

        {featuredProducts.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950">
            <p className="font-mono text-[10px] uppercase tracking-wider text-violet-500">{t('store.featuredTitle', { defaultValue: '特集ピックアップ' })}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={`featured-${product.id}`} product={product} displayCurrency={currency} />
              ))}
            </div>
          </div>
        )}

        {viewedProducts.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950">
            <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-500">{t('store.recentlyViewed', { defaultValue: '最近見た商品' })}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {viewedProducts.map((product) => (
                <ProductCard key={`viewed-${product.id}`} product={product} displayCurrency={currency} />
              ))}
            </div>
          </div>
        )}

        {rankingProducts.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-500">
                {rankingVariant === 'A' ? t('store.rankingTitle', { defaultValue: '売上ランキング' }) : t('store.rankingTitleB', { defaultValue: '人気トレンド' })}
              </p>
              <div className="inline-flex rounded-full border border-gray-200 p-1 dark:border-gray-800">
                {(['7d', '30d'] as const).map((range) => (
                  <button key={range} type="button" onClick={() => setRankingRange(range)} className={`rounded-full px-3 py-1 text-[11px] ${rankingRange === range ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400'}`}>
                    {range === '7d' ? t('store.ranking7d', { defaultValue: '直近7日' }) : t('store.ranking30d', { defaultValue: '直近30日' })}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {stockoutForecast.length > 0 && (
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="font-mono text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300">
              {t('store.stockoutTitle', { defaultValue: '在庫予測 / 欠品予防' })}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-200">
              {stockoutForecast.map((row) => (
                <li key={row.productId}>{row.productTitle}: {t('store.stockoutSummary', { defaultValue: `${row.daysUntilStockout}日で欠品予測 (${row.estimatedStockoutDate})` })}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950">
          <p className="font-mono text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-600">status guide</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-emerald-600">AVAILABLE</span>
            <span className="text-gray-500 dark:text-gray-500">購入可能。すぐに購入またはカート追加できます。</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]"><Badge variant="coming_soon" size="sm" /><span className="text-gray-500 dark:text-gray-500">{t('store.statusComingSoon', { defaultValue: '販売準備中。公開通知を待機できます。' })}</span></div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]"><Badge variant="soldout" size="sm" /><span className="text-gray-500 dark:text-gray-500">{t('store.statusSoldout', { defaultValue: '完売。再販情報は News / Fanclub で案内します。' })}</span></div>
        </div>
      </motion.div>

      {loading && <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonProductCard key={i} />)}</div>}
      {error && <p className="mt-8 font-mono text-sm text-red-400">! {t('common.error')}</p>}

      {!loading && !error && filteredProducts.length === 0 && (
        <div className="mt-16 rounded border border-dashed border-gray-200 p-8 text-center dark:border-gray-800">
          <p className="font-mono text-sm text-gray-500 dark:text-gray-500">{t('home.store.comingSoon')}</p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">{t('store.empty')}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            <Link to={ROUTES.CONTACT} className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">{t('store.requestCta')} →</Link>
            <Link to={ROUTES.FANCLUB} className="inline-flex items-center text-xs font-mono text-violet-500 hover:text-violet-400">{t('store.emptySubCta')} →</Link>
          </div>
        </div>
      )}

      {filteredProducts.length > 0 && (
        <div id="store-products" className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <div key={product.id} onClick={() => trackEvent('store_product_card_click', { slug: product.slug })}>
              <ProductCard product={product} displayCurrency={currency} />
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="mt-16 flex flex-col gap-4 border-t border-gray-100 pt-10 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-400 dark:text-gray-600">{t('store.fcNote')}</p>
            <p className="mt-1 font-mono text-[11px] text-gray-300 dark:text-gray-700">{t('store.stripeNote')}</p>
          </div>
          <Link to={ROUTES.FANCLUB} className="inline-flex shrink-0 items-center gap-2 border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 dark:border-gray-800 dark:text-gray-300 dark:hover:border-gray-600">
            {t('home.fanclub.joinButton')}<span>→</span>
          </Link>
        </div>
      )}
    </section>
  )
}
