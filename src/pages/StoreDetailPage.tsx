import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useProductDetail } from '@/modules/store/hooks/useProductDetail'
import { shopifyProductUrl } from '@/modules/store/api'
import { formatPrice } from '@/utils'
import { ROUTES } from '@/lib/routeConstants'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import SkeletonProductDetail from '@/components/common/SkeletonProductDetail'

export default function StoreDetailPage() {
  const { handle } = useParams<{ handle: string }>()
  const { t } = useTranslation()
  const { product, loading, error, notFound } = useProductDetail(handle)

  const shopifyDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN as string | undefined

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      {loading && <SkeletonProductDetail />}
      {error && <ErrorState message={error} />}
      {notFound && <NotFoundState backTo={ROUTES.STORE} />}

      {product && (
        <>
        <PageHead
          title={product.title}
          description={product.description || undefined}
          ogImage={product.featuredImage?.url}
          ogType="article"
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 gap-12 md:grid-cols-2"
        >
          {/* 画像 */}
          <div className="aspect-square overflow-hidden bg-gray-100">
            {product.featuredImage ? (
              <img
                src={product.featuredImage.url}
                alt={product.featuredImage.altText ?? product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-xs text-gray-300">No image</span>
              </div>
            )}
          </div>

          {/* 情報 */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold text-gray-900">{product.title}</h1>

            <p className="mt-3 text-lg text-gray-700">
              {formatPrice(
                product.priceRange.minVariantPrice.amount,
                product.priceRange.minVariantPrice.currencyCode,
              )}
            </p>

            {!product.availableForSale && (
              <p className="mt-2 text-sm text-gray-400">{t('store.outOfStock')}</p>
            )}

            {/* バリエーション */}
            {product.variants.nodes.length > 1 && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-widest text-gray-400">
                  {t('store.variants')}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.variants.nodes.map((variant) => (
                    <span
                      key={variant.id}
                      className={`border px-3 py-1 text-sm ${
                        variant.availableForSale
                          ? 'border-gray-300 text-gray-700'
                          : 'border-gray-100 text-gray-300'
                      }`}
                    >
                      {variant.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 説明 */}
            {product.description && (
              <p className="mt-6 text-sm leading-relaxed text-gray-500">
                {product.description}
              </p>
            )}

            {/* Shopify 購入導線 */}
            {shopifyDomain && product.availableForSale && (
              <a
                href={shopifyProductUrl(shopifyDomain, product.handle)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center bg-gray-900 px-6 py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-gray-700"
              >
                {t('store.buyOnShopify')}
              </a>
            )}
          </div>
        </motion.div>
        </>
      )}
    </section>
  )
}
