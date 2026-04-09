import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
    if (error) {
      trackApiFailure('store_products', error)
    }
  }, [error])

  useEffect(() => {
    if (!loading && !error && filtered.length === 0) {
      trackEmptyState('store_products', { status, collection, tag, sort, hasSearch: Boolean(search.trim()) })
    }
  }, [collection, error, filtered.length, loading, search, sort, status, tag])

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHead title="全商品 | mizzz Official Store" description="mizzz Official Store の全商品一覧。カテゴリ・在庫状態で絞り込みできます。" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500">Store catalog</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">All Products</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">新着 / 在庫状況 / カテゴリで絞り込みできます。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/cart" onClick={() => trackCtaClick('store_products', 'cart')} className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">カート</Link>
          <Link to="/faq" onClick={() => trackCtaClick('store_products', 'faq')} className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">FAQ</Link>
          <Link to="/guide" onClick={() => trackCtaClick('store_products', 'guide')} className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">Guide</Link>
          <Link to="/news" onClick={() => trackCtaClick('store_products', 'news')} className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">News</Link>
        </div>
      </div>

      <div className="sticky top-20 z-20 mt-6 rounded-2xl border border-gray-200/80 bg-white/95 p-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-gray-500 dark:text-gray-400 sm:col-span-2">
            検索
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                trackCtaClick('store_products_filter', 'search_input', { keyword_length: event.target.value.length })
              }}
              placeholder="商品名・説明で検索"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </label>
          <label className="text-xs text-gray-500 dark:text-gray-400">
            在庫状態
            <select value={status} onChange={(event) => {
              setStatus(event.target.value as typeof status)
              trackCtaClick('store_products_filter', 'status_filter', { value: event.target.value })
            }} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <option value="all">すべて</option>
              <option value="available">販売中</option>
              <option value="coming_soon">販売準備中</option>
              <option value="soldout">売り切れ</option>
            </select>
          </label>
          <label className="text-xs text-gray-500 dark:text-gray-400">
            カテゴリ
            <select value={collection} onChange={(event) => {
              setCollection(event.target.value)
              trackCtaClick('store_products_filter', 'collection_filter', { value: event.target.value })
            }} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <option value="all">すべて</option>
              {DEFAULT_COLLECTIONS.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-500 dark:text-gray-400">
            タグ
            <select value={tag} onChange={(event) => {
              setTag(event.target.value)
              trackCtaClick('store_products_filter', 'tag_filter', { value: event.target.value })
            }} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <option value="all">すべて</option>
              {availableTags.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-500 dark:text-gray-400">
            並び順
            <select value={sort} onChange={(event) => {
              setSort(event.target.value as typeof sort)
              trackCtaClick('store_products_filter', 'sort', { value: event.target.value })
            }} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <option value="recommended">おすすめ順</option>
              <option value="newest">新着優先</option>
              <option value="price_asc">価格が安い順</option>
              <option value="price_desc">価格が高い順</option>
            </select>
          </label>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">表示件数: {loading ? '...' : filtered.length}件</p>
      {activeCampaign && <CampaignHero campaign={activeCampaign} location="store_products_campaign_block" />}
      {!loading && !error && (
        <EditorialSpotlightSection
          title="ピックアップ"
          subtitle="キャンペーン・限定・トレンド商品を優先表示"
          items={campaignSpotlights}
        />
      )}

      {loading && <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, idx) => <SkeletonProductCard key={idx} />)}</div>}
      {error && <div className="mt-8"><ErrorState message={error} onRetry={refetch} location="store_products" /></div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          条件に合う商品がありません。絞り込み条件を変更してください。
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product} trackingLocation="store_products_grid" />)}</div>
      )}
    </section>
  )
}
