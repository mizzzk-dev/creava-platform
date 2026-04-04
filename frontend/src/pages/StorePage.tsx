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
import { SITE_URL } from '@/lib/seo'

export default function StorePage() {
  const { t } = useTranslation()
  const { products, loading, error } = useProductList(12)
  const { filterVisible } = useContentAccess()

  const visibleProducts = filterVisible(products)

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <PageHead title={t('store.title')} description={t('seo.store')} />
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
        <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
          store
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          {t('store.title')}
        </h1>
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-600">
          {t('home.store.description')}
        </p>
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
        <div className="mt-16 text-center">
          <p className="font-mono text-sm text-gray-300 dark:text-gray-700">
            {t('home.store.comingSoon')}
          </p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
            {t('store.empty')}
          </p>
        </div>
      )}

      {visibleProducts.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* FC 誘導 */}
      {!loading && (
        <div className="mt-16 border-t border-gray-100 dark:border-gray-800 pt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-gray-400 dark:text-gray-600">
            {t('store.fcNote')}
          </p>
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
