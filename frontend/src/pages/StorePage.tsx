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
import { forecastStockout, getAbVariant, getRegionCommercePolicy } from '@/modules/store/lib/commerceOptimization'

export default function StorePage() {
  const { t } = useTranslation()
  useListPageWebVitals('store-list')
  const { products, loading, error } = useProductList(12)
  const { filterVisible } = useContentAccess()
  const { currency, updateCurrency } = useDisplayCurrency('JPY')
  const [rankingRange, setRankingRange] = useState<RankingRange>('7d')
  const [region, setRegion] = useState<'JP' | 'US' | 'EU' | 'ROW'>('JP')

  const visibleProducts = filterVisible(products)
  const rankingProducts = getRankedProducts(visibleProducts, rankingRange, 3)
  const heroVariant = useMemo(() => getAbVariant('storeHero'), [])
  const rankingVariant = useMemo(() => getAbVariant('storeRanking'), [])
  const ctaVariant = useMemo(() => getAbVariant('storeCta'), [])
  const regionPolicy = getRegionCommercePolicy(region)
  const stockoutForecast = forecastStockout(visibleProducts.slice(0, 3).map((product, index) => ({
    productId: product.id,
    productTitle: product.title,
    stockUnits: 30 - index * 8,
    soldUnitsLast7d: 10 + index * 4,
    restockLeadDays: 14,
    notifyWaitlist: 12 + index * 3,
  })))

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
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
      >
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 via-white to-violet-50 px-6 py-8 dark:border-gray-800 dark:from-gray-900 dark:via-gray-950 dark:to-violet-950/30 sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.15),transparent_48%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.2),transparent_45%)]" />
          <p className="relative font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
            store / brand-first commerce
          </p>
          <h1 className="relative mt-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            {t('store.title')}
          </h1>
          <p className="relative mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {heroVariant === 'A'
              ? '作品販売だけでなく、制作依頼やFanclub導線をつないだ「ホームページ主軸」のストア体験を提供します。'
              : 'ブランド体験と購入導線を両立し、継続的に改善するストア体験を提供します。'}
          </p>
          <div className="relative mt-5 flex flex-wrap gap-3">
            <a href="#store-products" className="inline-flex items-center bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
              {ctaVariant === 'A' ? '商品を見る →' : 'おすすめ商品へ →'}
            </a>
            <Link to={ROUTES.CONTACT} className="inline-flex items-center border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100">
              {ctaVariant === 'A' ? '制作依頼する →' : '相談して選ぶ →'}
            </Link>
            <Link to={ROUTES.CART} className="inline-flex items-center text-xs font-mono text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
              {t('cart.goToCart', { defaultValue: 'カートを見る' })} →
            </Link>
          </div>
          <div className="relative mt-4 flex flex-wrap gap-2">
            <span className="rounded-sm border border-gray-200 dark:border-gray-800 px-2 py-1 font-mono text-[10px] text-gray-400 dark:text-gray-600">
              {t('store.subtitle')}
            </span>
            <span className="rounded-sm border border-violet-200/60 dark:border-violet-900/40 px-2 py-1 font-mono text-[10px] text-violet-500">
              {t('store.fanclubLead')}
            </span>
          </div>
        </div>
        <div className="mt-4 rounded border border-gray-200 px-3 py-3 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              {t('store.currencyLabel', { defaultValue: '表示通貨' })}
              <select
                value={currency}
                onChange={(event) => updateCurrency(event.target.value as typeof currency)}
                className="ml-2 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                {DISPLAY_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {t('store.currencyNotice', { defaultValue: '表示通貨のみ切替。決済は商品ページ記載の通貨が適用されます。' })}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded border border-gray-200 px-3 py-3 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              {t('store.regionLabel', { defaultValue: '配送地域' })}
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value as typeof region)}
                className="ml-2 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="JP">JP</option>
                <option value="US">US</option>
                <option value="EU">EU</option>
                <option value="ROW">ROW</option>
              </select>
            </label>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {t('store.regionNotice', {
                defaultValue: `通貨:${regionPolicy.currency} / 送料:${regionPolicy.shippingFee} / 税率:${Math.round(regionPolicy.taxRate * 100)}% / 配送:${regionPolicy.canShip ? '可' : '不可'}`,
              })}
            </p>
          </div>
        </div>

        {rankingProducts.length > 0 && (
          <div className="mt-4 rounded border border-gray-200 px-3 py-3 dark:border-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-600">
{rankingVariant === 'A' ? t('store.rankingTitle', { defaultValue: '売上ランキング' }) : t('store.rankingTitleB', { defaultValue: '人気トレンド' })}
              </p>
              <div className="inline-flex rounded border border-gray-200 dark:border-gray-800 p-0.5">
                {(['7d', '30d'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setRankingRange(range)}
                    className={`px-2 py-1 text-[11px] ${rankingRange === range ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    {range === '7d' ? t('store.ranking7d', { defaultValue: '直近7日' }) : t('store.ranking30d', { defaultValue: '直近30日' })}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {rankingProducts.map((product, index) => (
                <div key={product.id} className="rounded border border-gray-100 p-2 dark:border-gray-800">
                  <p className="font-mono text-[10px] text-violet-500">#{index + 1}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-700 dark:text-gray-200">{product.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {stockoutForecast.length > 0 && (
          <div className="mt-4 rounded border border-amber-200/70 bg-amber-50/50 px-3 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="font-mono text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300">
              {t('store.stockoutTitle', { defaultValue: '在庫予測 / 欠品予防' })}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-200">
              {stockoutForecast.map((row) => (
                <li key={row.productId}>
                  {row.productTitle}: {t('store.stockoutSummary', { defaultValue: `${row.daysUntilStockout}日で欠品予測 (${row.estimatedStockoutDate})` })}
                  {row.shouldAlert && ` / 通知候補 ${row.suggestedNotifyAudience}名`}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 rounded border border-gray-200 px-3 py-3 dark:border-gray-800">
          <p className="font-mono text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-600">status guide</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-emerald-600">
              AVAILABLE
            </span>
            <span className="text-gray-500 dark:text-gray-500">購入可能。すぐに購入またはカート追加できます。</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <Badge variant="coming_soon" size="sm" />
            <span className="text-gray-500 dark:text-gray-500">{t('store.statusComingSoon', { defaultValue: '販売準備中。公開通知を待機できます。' })}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <Badge variant="soldout" size="sm" />
            <span className="text-gray-500 dark:text-gray-500">{t('store.statusSoldout', { defaultValue: '完売。再販情報は News / Fanclub で案内します。' })}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <Badge variant="fc" size="sm" label="MEMBERS" />
            <span className="text-gray-500 dark:text-gray-500">
              {t('store.statusMembers', { defaultValue: '会員限定商品。' })}
              <Link to={ROUTES.MEMBER} className="ml-1 font-mono text-violet-500 hover:text-violet-400">
                Member status確認 →
              </Link>
            </span>
          </div>
        </div>
      </motion.div>

      {loading && (
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonProductCard key={i} />
          ))}
        </div>
      )}

      {error && (
        <p className="mt-8 font-mono text-sm text-red-400">! {t('common.error')}</p>
      )}

      {!loading && !error && visibleProducts.length === 0 && (
        <div className="mt-16 rounded border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center">
          <p className="font-mono text-sm text-gray-500 dark:text-gray-500">
            {t('home.store.comingSoon')}
          </p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
            {t('store.empty')}
          </p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
            {t('store.emptySupport', { defaultValue: '公開前アイテムは限定案内で先行告知します。' })}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={ROUTES.CONTACT}
              className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              {t('store.requestCta')} →
            </Link>
            <Link
              to={ROUTES.FANCLUB}
              className="inline-flex items-center text-xs font-mono text-violet-500 hover:text-violet-400"
            >
              {t('store.emptySubCta')} →
            </Link>
          </div>
        </div>
      )}

      {visibleProducts.length > 0 && (
        <div id="store-products" className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} displayCurrency={currency} />
          ))}
        </div>
      )}

      {!loading && (
        <div className="mt-16 border-t border-gray-100 dark:border-gray-800 pt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400 dark:text-gray-600">
              {t('store.fcNote')}
            </p>
            <p className="mt-1 font-mono text-[11px] text-gray-300 dark:text-gray-700">{t('store.stripeNote')}</p>
          </div>
          <Link
            to={ROUTES.FANCLUB}
            className="shrink-0 inline-flex items-center gap-2 border border-gray-200 dark:border-gray-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:border-gray-400 dark:hover:border-gray-600"
          >
            {t('home.fanclub.joinButton')}
            <span>→</span>
          </Link>
        </div>
      )}
    </section>
  )
}
