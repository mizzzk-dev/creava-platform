import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useProductList } from '@/modules/store/hooks/useProductList'
import ProductCard from '@/modules/store/components/ProductCard'
import SkeletonProductCard from '@/components/common/SkeletonProductCard'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import { DEFAULT_COLLECTIONS, inferCollectionSlug } from '@/modules/store/lib/catalog'
import { useStrapiCollection } from '@/hooks'
import { getNewsList } from '@/modules/news/api'
import { getFaqList } from '@/modules/faq/api'
import type { FAQItem, NewsItem } from '@/types'

export default function StorefrontHomePage() {
  const { products, loading, error, refetch } = useProductList(24)
  const { items: news, loading: newsLoading, error: newsError, refetch: refetchNews } = useStrapiCollection<NewsItem>(
    () => getNewsList({ pagination: { pageSize: 4, withCount: false } }),
  )
  const { items: faqs, loading: faqLoading, error: faqError, refetch: refetchFaq } = useStrapiCollection<FAQItem>(
    () => getFaqList({ pagination: { pageSize: 4, withCount: false } }),
  )

  const newArrivals = useMemo(() => products.slice(0, 8), [products])
  const featured = useMemo(() => products.filter((product) => product.accessStatus !== 'fc_only').slice(0, 4), [products])
  const digitalGoods = useMemo(() => products.filter((product) => inferCollectionSlug(product) === 'digital').slice(0, 4), [products])
  const pickup = useMemo(() => products.filter((product) => product.purchaseStatus === 'available').slice(0, 2), [products])

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <PageHead title="mizzz Official Store" description="mizzz公式オンラインストア。新商品・デジタル商品・お知らせをまとめて確認できます。" />

      <header className="overflow-hidden rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900/70 dark:shadow-black/20 sm:p-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">mizzz official store</p>
        <div className="mt-4 grid gap-7 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">静けさの中で、
              <span className="block text-gray-500 dark:text-gray-400">欲しいものに迷わず届く。</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">新着・限定・デジタル商品をエディトリアルに整理。商品が少ない時も、多い時も、見つけやすく心地よいストア体験を保ちます。</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/products" className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-gray-900">全商品を見る</Link>
              <Link to="/collections/digital" className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200">Digital Goods</Link>
              <Link to="/guide" className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200">Guide</Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <article className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-950/60">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">This week</p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">新着ドロップと限定販売の更新を毎週整理して掲載。</p>
            </article>
            <article className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-950/60">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">Support</p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">FAQ / Guide / News へ1タップで移動できる導線を維持。</p>
            </article>
          </div>
        </div>
      </header>

      {!loading && !error && pickup.length > 0 && (
        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {pickup.map((item, index) => (
            <Link key={item.id} to={`/products/${item.slug}`} className={`group overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 ${index === 0 ? 'lg:col-span-2' : ''}`}>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">Editor's pick</p>
              <h2 className="mt-2 text-lg font-semibold text-gray-900 group-hover:text-gray-600 dark:text-gray-100 dark:group-hover:text-gray-300">{item.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">詳細ページで商品の仕様や購入条件を確認できます。</p>
            </Link>
          ))}
          <Link to="/news" className="rounded-2xl border border-dashed border-gray-300 p-5 text-sm text-gray-600 transition hover:border-gray-500 dark:border-gray-700 dark:text-gray-300">
            今週のおすすめ・お知らせを見る →
          </Link>
        </section>
      )}

      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">New Arrival</h2>
          <Link to="/products" className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">もっと見る →</Link>
        </div>
        {loading && <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, idx) => <SkeletonProductCard key={idx} />)}</div>}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && newArrivals.length === 0 && <p className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">公開中の商品はまだありません。</p>}
        {!loading && !error && newArrivals.length > 0 && <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {DEFAULT_COLLECTIONS.map((collection) => (
          <Link key={collection.slug} to={`/collections/${collection.slug}`} className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70">
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500">{collection.name}</p>
            <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{collection.description}</p>
          </Link>
        ))}
      </section>

      <section className="mt-12 grid gap-10 lg:grid-cols-2">
        {!loading && !error && featured.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Featured</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          </div>
        )}

        {!loading && !error && digitalGoods.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Digital Goods</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">{digitalGoods.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          </div>
        )}
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/70">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">お知らせ</h2>
            <Link to="/news" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">一覧へ →</Link>
          </div>
          {newsLoading && <p className="text-sm text-gray-500">読み込み中...</p>}
          {newsError && <ErrorState message={newsError} onRetry={refetchNews} />}
          {!newsLoading && !newsError && (!news || news.length === 0) && <p className="text-sm text-gray-500">お知らせはまだありません。</p>}
          {!newsLoading && !newsError && news && news.length > 0 && (
            <ul className="space-y-2">
              {news.map((item) => (
                <li key={item.id}>
                  <Link to={`/news/${item.slug}`} className="text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/70">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">FAQ / Guide</h2>
            <div className="flex items-center gap-2 text-xs">
              <Link to="/faq" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">FAQ</Link>
              <Link to="/guide" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">Guide</Link>
            </div>
          </div>
          {faqLoading && <p className="text-sm text-gray-500">読み込み中...</p>}
          {faqError && <ErrorState message={faqError} onRetry={refetchFaq} />}
          {!faqLoading && !faqError && (!faqs || faqs.length === 0) && <p className="text-sm text-gray-500">FAQ は準備中です。</p>}
          {!faqLoading && !faqError && faqs && faqs.length > 0 && (
            <ul className="space-y-2">
              {faqs.map((item) => (
                <li key={item.id} className="text-sm text-gray-700 dark:text-gray-300">Q. {item.question}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </section>
  )
}
