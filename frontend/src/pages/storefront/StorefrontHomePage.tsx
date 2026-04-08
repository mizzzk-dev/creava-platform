import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useProductList } from '@/modules/store/hooks/useProductList'
import ProductCard from '@/modules/store/components/ProductCard'
import SkeletonProductCard from '@/components/common/SkeletonProductCard'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import { DEFAULT_COLLECTIONS, inferCollectionSlug } from '@/modules/store/lib/catalog'

export default function StorefrontHomePage() {
  const { products, loading, error, refetch } = useProductList(24)

  const newArrivals = useMemo(() => products.slice(0, 8), [products])
  const featured = useMemo(() => products.filter((product) => product.accessStatus !== 'fc_only').slice(0, 8), [products])
  const digitalGoods = useMemo(() => products.filter((product) => inferCollectionSlug(product) === 'digital').slice(0, 6), [products])

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHead title="mizzz Official Store" description="mizzz公式オンラインストア。新商品・デジタル商品・お知らせをまとめて確認できます。" />

      <header className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">mizzz official store</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">静かに選び、長く使う。</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">新着、定番、デジタル商品を整理して掲載。購入前に必要な情報へ、迷わず辿れる導線を設計しています。</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/products" className="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white dark:bg-white dark:text-gray-900">全商品を見る</Link>
          <Link to="/guide" className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200">購入ガイド</Link>
        </div>
      </header>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">New Arrival</h2>
          <Link to="/products" className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">もっと見る →</Link>
        </div>
        {loading && <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, idx) => <SkeletonProductCard key={idx} />)}</div>}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {DEFAULT_COLLECTIONS.map((collection) => (
          <Link key={collection.slug} to={`/collections/${collection.slug}`} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500">{collection.name}</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{collection.description}</p>
          </Link>
        ))}
      </section>

      {!loading && !error && featured.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Featured</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </section>
      )}

      {!loading && !error && digitalGoods.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Digital Goods</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">{digitalGoods.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </section>
      )}
    </section>
  )
}
