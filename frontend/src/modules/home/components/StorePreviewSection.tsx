import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useProductList } from '@/modules/store/hooks/useProductList'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import SectionHeader from '@/components/common/SectionHeader'
import Badge from '@/components/common/Badge'
import { formatPriceNum } from '@/utils'

export default function StorePreviewSection() {
  const { t } = useTranslation()
  const { products, loading } = useProductList(6)

  const previewItems = products
    .filter((p) => p.accessStatus !== 'fc_only')
    .slice(0, 3)

  return (
    <motion.section
      className="bg-gray-50/50 px-4 py-20"
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
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-gray-300 dark:text-gray-700">
          {t('store.stripeLead')}
        </p>

        {/* skeleton */}
        {loading && (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton aspect-square" />
                <div className="skeleton mt-2 h-3 w-3/4 rounded" />
                <div className="skeleton mt-1.5 h-2.5 w-16 rounded" />
              </div>
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
                className="group bento-card block overflow-hidden transition-all duration-200"
              >
                {/* image */}
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  {product.previewImage ? (
                    <img
                      src={product.previewImage.url}
                      alt={product.previewImage.alt ?? product.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="dot-grid flex h-full w-full flex-col items-center justify-center gap-2 opacity-40">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-gray-300">
                        item_{String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                  )}

                  {/* soldout overlay */}
                  {product.purchaseStatus === 'soldout' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <Badge variant="soldout" size="sm" />
                    </div>
                  )}

                  {/* status badges top-right */}
                  <div className="absolute right-2 top-2 flex flex-col gap-1">
                    {product.accessStatus === 'fc_only' && <Badge variant="fc" />}
                    {product.accessStatus === 'limited' && <Badge variant="limited" />}
                    {product.purchaseStatus === 'coming_soon' && <Badge variant="coming_soon" />}
                  </div>
                </div>

                {/* meta */}
                <div className="px-3 pb-3 pt-2.5">
                  <p className="line-clamp-1 text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-600">
                    {product.title}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-mono text-xs text-gray-400">
                      {product.purchaseStatus === 'soldout'
                        ? t('store.soldOut')
                        : product.purchaseStatus === 'coming_soon'
                          ? t('store.comingSoon')
                          : formatPriceNum(product.price, product.currency)}
                    </p>
                    <span className="font-mono text-[10px] text-gray-200 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-gray-400">
                      →
                    </span>
                  </div>
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

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            to={ROUTES.STORE}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            {t('home.store.viewAll')}
            <span>→</span>
          </Link>
          <Link
            to={ROUTES.FANCLUB}
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-violet-500 hover:text-violet-400"
          >
            {t('store.fanclubLead')}
            <span>→</span>
          </Link>
        </div>
      </div>
    </motion.section>
  )
}
