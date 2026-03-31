import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useProductList } from '@/modules/store/hooks/useProductList'
import ProductCard from '@/modules/store/components/ProductCard'

export default function StorePage() {
  const { t } = useTranslation()
  const { products, loading, error } = useProductList(12)

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-xs uppercase tracking-widest text-gray-400">
          {t('store.title')}
        </h1>

        {loading && (
          <p className="mt-8 text-sm text-gray-400">{t('common.loading')}</p>
        )}

        {error && (
          <p className="mt-8 text-sm text-red-400">{t('common.error')}</p>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="mt-8 text-sm text-gray-400">{t('store.empty')}</p>
        )}

        {products.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  )
}
