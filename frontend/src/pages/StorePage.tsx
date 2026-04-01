import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useProductList } from '@/modules/store/hooks/useProductList'
import { useContentAccess } from '@/hooks'
import ProductCard from '@/modules/store/components/ProductCard'
import PageHead from '@/components/seo/PageHead'
import SkeletonProductCard from '@/components/common/SkeletonProductCard'

export default function StorePage() {
  const { t } = useTranslation()
  const { products, loading, error } = useProductList(12)
  const { filterVisible } = useContentAccess()

  // FC 表示制御：ゲストには fc_only 商品を非表示
  const visibleProducts = filterVisible(products)

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PageHead title={t('store.title')} description={t('seo.store')} />
        <h1 className="text-xs uppercase tracking-widest text-gray-400">
          {t('store.title')}
        </h1>

        {loading && (
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonProductCard key={i} />
            ))}
          </div>
        )}

        {error && (
          <p className="mt-8 text-sm text-red-400">{t('common.error')}</p>
        )}

        {!loading && !error && visibleProducts.length === 0 && (
          <p className="mt-8 text-sm text-gray-400">{t('store.empty')}</p>
        )}

        {visibleProducts.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  )
}
