import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ProductCard from '@/modules/store/components/ProductCard'
import { useProductList } from '@/modules/store/hooks/useProductList'
import SkeletonProductCard from '@/components/common/SkeletonProductCard'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import { DEFAULT_COLLECTIONS, inferCollectionSlug } from '@/modules/store/lib/catalog'
import { trackApiFailure, trackCtaClick, trackEmptyState } from '@/modules/analytics/tracking'
import EditorialSpotlightSection from '@/components/common/EditorialSpotlightSection'
import { useStrapiCollection } from '@/hooks'
import { getCampaignList } from '@/modules/campaign/api'
import type { CampaignSummary } from '@/modules/campaign/types'
import { isCampaignActive } from '@/modules/campaign/lib'
import CampaignHero from '@/modules/campaign/components/CampaignHero'
import NotificationInterestButton from '@/modules/notifications/components/NotificationInterestButton'

const SELECT_CLS =
  'mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-700 transition-colors focus:border-gray-400 focus:outline-none dark:border-[rgba(6,182,212,0.15)] dark:bg-[rgba(6,6,15,0.6)] dark:text-[rgba(180,190,220,0.7)] dark:focus:border-cyan-500/40'

export default function StorefrontProductsPage() {
  const { products, loading, error, refetch } = useProductList(120)
  const { items: campaigns } = useStrapiCollection<CampaignSummary>(() => getCampaignList())
  const [status, setStatus] = useState<'all' | 'available' | 'soldout' | 'coming_soon'>('all')
  const [collection, setCollection] = useState<string>('all')
  const [tag, setTag] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'recommended' | 'price_asc' | 'price_desc' | 'newest'>('recommended')

  const availableTags = useMemo(
    () => Array.from(new Set(products.flatMap((product) => product.tags))).sort((a, b) => a.localeCompare(b, 'ja')),
    [products],
  )

  const filtered = useMemo(() => {
    const base = products.filter((product) => {
      if (status !== 'all' && product.purchaseStatus !== status) return false
      if (collection !== 'all' && inferCollectionSlug(product) !== collection) return false
      if (tag !== 'all' && !product.tags.includes(tag)) return false
      if (search.trim() && !`${product.title} ${product.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    if (sort === 'price_asc') return [...base].sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') return [...base].sort((a, b) => b.price - a.price)
    if (sort === 'newest') return [...base].sort((a, b) => Number(b.isNewArrival) - Number(a.isNewArrival))
    return [...base].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [collection, products, search, sort, status, tag])

  const campaignSpotlights = useMemo(
    () =>
      filtered
        .filter((item) => item.campaignLabel || item.isTrending || item.isLimited)
        .slice(0, 3)
        .map((item) => ({
          id: `products-spotlight-${item.id}`,
          eyebrow: item.campaignLabel ?? (item.isLimited ? 'LIMITED DROP' : 'TRENDING'),
          title: item.title,
          description: item.shortHighlight ?? item.heroCopy ?? '特集で紹介中のアイテムです。',
          href: `/products/${item.slug}`,
          ctaLabel: '商品詳細へ',
          tone: (item.earlyAccess || item.accessStatus === 'fc_only' ? 'member' : item.campaignLabel ? 'campaign' : 'default') as 'default' | 'campaign' | 'member',
          trackingLocation: 'store_products_spotlight',
        })),
    [filtered],
  )

  const activeCampaign = useMemo(
    () =>
      (campaigns ?? [])
        .filter((item) => isCampaignActive(item))
        .sort((a, b) => (b.displayPriority ?? 0) - (a.displayPriority ?? 0))[0] ?? null,
    [campaigns],
  )

  useEffect(() => {
    if (error) trackApiFailure('store_products', error)
  }, [error])

  useEffect(() => {
    if (!loading && !error && filtered.length === 0) {
      trackEmptyState('store_products', { status, collection, tag, sort, hasSearch: Boolean(search.trim()) })
    }
  }, [collection, error, filtered.length, loading, search, sort, status, tag])

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHead title="全商品 | mizzz Official Store" description="mizzz Official Store の全商品一覧。カテゴリ・在庫状態で絞り込みできます。" />

      {/* page header */}
      <motion.div
        className="flex flex-wrap items-end justify-between gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <p className="section-eyebrow mb-3">store catalog</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-4xl">
            All Products
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[rgba(180,190,220,0.55)]">
            新着 / 在庫状況 / カテゴリで絞り込みできます。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { to: '/cart',  label: 'カート', key: 'cart'  },
            { to: '/faq',   label: 'FAQ',    key: 'faq'   },
            { to: '/guide', label: 'Guide',  key: 'guide' },
            { to: '/news',  label: 'News',   key: 'news'  },
          ].map(({ to, label, key }) => (
            <Link
              key={key}
              to={to}
              onClick={() => trackCtaClick('store_products', key)}
              className="btn-cyber-ghost focus-ring text-xs"
            >
              {label}
            </Link>
          ))}
        </div>
      </motion.div>

      <NotificationInterestButton
        location="store_products"
        topic="weekly_update"
        site="store"
        targetType="digest"
        targetId="store-weekly-highlight"
        title="今週の注目商品"
        description="再入荷・販売開始・キャンペーン開始の通知"
        defaultLabel="今週の注目通知を受け取る"
      />

      {/* filter bar */}
      <motion.div
        className="sticky top-20 z-20 mt-6 glass-cyber p-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-gray-400 dark:text-cyan-500/30">// filter</span>
          <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent dark:from-cyan-500/20" />
          <span className="font-mono text-[9px] text-gray-500 dark:text-[rgba(6,182,212,0.35)]">
            {loading ? '...' : filtered.length} items
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="sm:col-span-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-gray-500 dark:text-[rgba(6,182,212,0.4)]">検索</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                trackCtaClick('store_products_filter', 'search_input', { keyword_length: event.target.value.length })
              }}
              placeholder="商品名・タグで検索"
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-700 placeholder:text-gray-400 transition-colors focus:border-gray-400 focus:outline-none dark:border-[rgba(6,182,212,0.15)] dark:bg-[rgba(6,6,15,0.6)] dark:text-[rgba(180,190,220,0.7)] dark:placeholder:text-[rgba(6,182,212,0.2)] dark:focus:border-cyan-500/40"
            />
          </label>
          <label>
            <span className="font-mono text-[9px] uppercase tracking-widest text-gray-500 dark:text-[rgba(6,182,212,0.4)]">在庫状態</span>
            <select value={status} onChange={(event) => {
              setStatus(event.target.value as typeof status)
              trackCtaClick('store_products_filter', 'status_filter', { value: event.target.value })
            }} className={SELECT_CLS}>
              <option value="all">すべて</option>
              <option value="available">販売中</option>
              <option value="coming_soon">販売準備中</option>
              <option value="soldout">売り切れ</option>
            </select>
          </label>
          <label>
            <span className="font-mono text-[9px] uppercase tracking-widest text-gray-500 dark:text-[rgba(6,182,212,0.4)]">カテゴリ</span>
            <select value={collection} onChange={(event) => {
              setCollection(event.target.value)
              trackCtaClick('store_products_filter', 'collection_filter', { value: event.target.value })
            }} className={SELECT_CLS}>
              <option value="all">すべて</option>
              {DEFAULT_COLLECTIONS.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </select>
          </label>
          <label>
            <span className="font-mono text-[9px] uppercase tracking-widest text-gray-500 dark:text-[rgba(6,182,212,0.4)]">タグ</span>
            <select value={tag} onChange={(event) => {
              setTag(event.target.value)
              trackCtaClick('store_products_filter', 'tag_filter', { value: event.target.value })
            }} className={SELECT_CLS}>
              <option value="all">すべて</option>
              {availableTags.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span className="font-mono text-[9px] uppercase tracking-widest text-gray-500 dark:text-[rgba(6,182,212,0.4)]">並び順</span>
            <select value={sort} onChange={(event) => {
              setSort(event.target.value as typeof sort)
              trackCtaClick('store_products_filter', 'sort', { value: event.target.value })
            }} className={SELECT_CLS}>
              <option value="recommended">おすすめ順</option>
              <option value="newest">新着優先</option>
              <option value="price_asc">価格が安い順</option>
              <option value="price_desc">価格が高い順</option>
            </select>
          </label>
        </div>
      </motion.div>

      {activeCampaign && <CampaignHero campaign={activeCampaign} location="store_products_campaign_block" />}
      {!loading && !error && (
        <EditorialSpotlightSection
          title="ピックアップ"
          subtitle="キャンペーン・限定・トレンド商品を優先表示"
          items={campaignSpotlights}
        />
      )}

      {loading && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => <SkeletonProductCard key={idx} />)}
        </div>
      )}
      {error && (
        <div className="mt-8">
          <ErrorState message={error} onRetry={refetch} location="store_products" />
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <motion.div
          className="mt-10 border border-dashed border-[rgba(6,182,212,0.15)] p-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-cyan-500/30 mb-2">// no_results</p>
          <p className="text-sm text-gray-500 dark:text-[rgba(180,190,220,0.5)]">
            条件に合う商品がありません。絞り込み条件を変更してください。
          </p>
        </motion.div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, delay: (i % 8) * 0.04 }}
            >
              <ProductCard product={product} trackingLocation="store_products_grid" />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}
