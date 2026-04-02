import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useProductList } from '@/modules/store/hooks/useProductList'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import SectionHeader from '@/components/common/SectionHeader'
import { formatPriceNum } from '@/utils'

export default function StorePreviewSection() {
  const { t } = useTranslation()
  const { products, loading } = useProductList(3)

  const previewItems = products.filter((p) => p.status === 'public').slice(0, 3)

  return (
    <motion.section
      className="bg-gray-50/60 px-4 py-20"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeader
          label={t('home.store.title')}
          viewAllTo={ROUTES.STORE}
          viewAllLabel={t('home.store.viewAll')}
        />

        {/* skeleton */}
        {loading && (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse bg-gray-100" />
            ))}
          </div>
        )}

        {/* products */}
        {!loading && previewItems.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {previewItems.map((product, i) => (
              <Link
                key={product.id}
                to={detailPath.product(product.slug)}
                className="group card-ring card-ring-hover block overflow-hidden bg-white transition-all duration-200"
              >
                {/* image area */}
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  {product.previewImage ? (
                    <img
                      src={product.previewImage.url}
                      alt={product.previewImage.alt ?? product.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-gray-200">
                        item_{String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                  )}

                  {product.purchaseStatus === 'soldout' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                        {t('store.soldOut')}
                      </span>
                    </div>
                  )}
                </div>

                {/* meta */}
                <div className="px-3 pb-3 pt-2.5">
                  <p className="line-clamp-1 text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-600">
                    {product.title}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-gray-400">
                    {formatPriceNum(product.price, product.currency)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* empty / coming soon */}
        {!loading && previewItems.length === 0 && (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex aspect-square flex-col items-center justify-center border border-dashed border-gray-150 bg-white"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-gray-200">
                  {t('home.store.comingSoon')}
                </span>
                <span className="mt-1 font-mono text-[9px] text-gray-100">
                  item_{String(i + 1).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  )
}
