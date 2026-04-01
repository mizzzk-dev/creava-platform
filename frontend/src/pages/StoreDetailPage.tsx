import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useProductDetail } from '@/modules/store/hooks/useProductDetail'
import PurchaseActions from '@/modules/store/components/PurchaseActions'
import { formatPriceNum } from '@/utils'
import { ROUTES } from '@/lib/routeConstants'
import ContentAccessGuard from '@/components/guards/ContentAccessGuard'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import SkeletonProductDetail from '@/components/common/SkeletonProductDetail'

export default function StoreDetailPage() {
  const { handle } = useParams<{ handle: string }>()
  const { t } = useTranslation()
  const { product, loading, error, notFound } = useProductDetail(handle)

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      {loading && <SkeletonProductDetail />}
      {error && <ErrorState message={error} />}
      {notFound && <NotFoundState backTo={ROUTES.STORE} />}

      {product && (
        <ContentAccessGuard item={product}>
          <PageHead
            title={product.title}
            description={product.description ?? undefined}
            ogImage={product.previewImage?.url}
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
              {product.previewImage ? (
                <img
                  src={product.previewImage.url}
                  alt={product.previewImage.alt ?? product.title}
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
                {formatPriceNum(product.price, product.currency)}
              </p>

              {/* 商品説明 */}
              {product.description && (
                <p className="mt-6 text-sm leading-relaxed text-gray-500">
                  {product.description}
                </p>
              )}

              {/* 補足説明（送料・受注生産など） */}
              {product.externalPurchaseNote && (
                <p className="mt-4 text-xs text-gray-400">{product.externalPurchaseNote}</p>
              )}

              {/* 購入導線（Stripe / BASE / 販売準備中 を自動出し分け） */}
              <PurchaseActions product={product} className="mt-8" />

              <p className="mt-4 text-xs text-gray-300">{t('store.backToStore')}</p>
            </div>
          </motion.div>
        </ContentAccessGuard>
      )}
    </section>
  )
}
