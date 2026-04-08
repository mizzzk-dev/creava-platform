import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useProductList } from '@/modules/store/hooks/useProductList'
import ProductCard from '@/modules/store/components/ProductCard'
import SkeletonProductCard from '@/components/common/SkeletonProductCard'
import ErrorState from '@/components/common/ErrorState'
import { DEFAULT_COLLECTIONS, inferCollectionSlug } from '@/modules/store/lib/catalog'
import NotFoundState from '@/components/common/NotFoundState'

export default function StorefrontCollectionPage() {
  const { slug } = useParams<{ slug: string }>()
  const { products, loading, error, refetch } = useProductList(120)

  const collection = DEFAULT_COLLECTIONS.find((item) => item.slug === slug)
  const items = useMemo(() => products.filter((product) => inferCollectionSlug(product) === slug), [products, slug])

  if (!collection) return <NotFoundState backTo="/products" />

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-gray-400">Collection</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{collection.name}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{collection.description}</p>
        </div>
        <Link to="/products" className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">全商品へ戻る →</Link>
      </div>

      {loading && <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, idx) => <SkeletonProductCard key={idx} />)}</div>}
      {error && <div className="mt-8"><ErrorState message={error} onRetry={refetch} /></div>}
      {!loading && !error && items.length === 0 && <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">このコレクションの商品は準備中です。</div>}
      {!loading && !error && items.length > 0 && <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
    </section>
  )
}
