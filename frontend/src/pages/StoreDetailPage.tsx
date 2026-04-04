import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useProductDetail } from '@/modules/store/hooks/useProductDetail'
import { useProductList } from '@/modules/store/hooks/useProductList'
import PurchaseActions from '@/modules/store/components/PurchaseActions'
import ProductCard from '@/modules/store/components/ProductCard'
import { formatPriceNum } from '@/utils'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import ContentAccessGuard from '@/components/guards/ContentAccessGuard'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import SkeletonProductDetail from '@/components/common/SkeletonProductDetail'
import Badge from '@/components/common/Badge'
import type { PurchaseStatus } from '@/modules/store/types'

function purchaseStatusToAvailability(status: PurchaseStatus): 'InStock' | 'OutOfStock' | 'PreOrder' {
  if (status === 'available') return 'InStock'
  if (status === 'soldout') return 'OutOfStock'
  return 'PreOrder'
}

export default function StoreDetailPage() {
  const { handle } = useParams<{ handle: string }>()
  const { t } = useTranslation()
  const { product, loading, error, notFound } = useProductDetail(handle)
  const { products } = useProductList(8)

  // 関連商品: 同一 accessStatus で現在商品を除く最大4件
  const related = products
    .filter((p) => p.slug !== handle && p.accessStatus === 'public')
    .slice(0, 4)

  const productUrl = `${SITE_URL}${detailPath.product(handle ?? '')}`

  const purchaseSummary =
    product?.purchaseStatus === 'soldout'
      ? t('store.soldOut')
      : product?.purchaseStatus === 'coming_soon'
        ? t('store.comingSoon')
        : product
          ? formatPriceNum(product.price, product.currency)
          : ''

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      {/* breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 font-mono text-[11px] text-gray-400 dark:text-gray-600">
        <Link to={ROUTES.STORE} className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          {t('store.title')}
        </Link>
        <span className="select-none">/</span>
        <span className="text-gray-500 dark:text-gray-500 truncate max-w-xs">{product?.title ?? '...'}</span>
      </nav>

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

          {/* 構造化データ: BreadcrumbList */}
          <StructuredData
            schema={{
              type: 'BreadcrumbList',
              items: [
                { name: 'Home', url: SITE_URL },
                { name: t('store.title'), url: `${SITE_URL}${ROUTES.STORE}` },
                { name: product.title, url: productUrl },
              ],
            }}
          />

          {/* 構造化データ: Product */}
          <StructuredData
            schema={{
              type: 'Product',
              name: product.title,
              description: product.description ?? undefined,
              image: product.previewImage?.url,
              price: product.price,
              priceCurrency: product.currency ?? 'JPY',
              availability: purchaseStatusToAvailability(product.purchaseStatus),
              url: productUrl,
              sellerName: SITE_NAME,
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 gap-12 md:grid-cols-2"
          >
            {/* 画像 */}
            <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
              {product.previewImage ? (
                <img
                  src={product.previewImage.url}
                  alt={product.previewImage.alt ?? product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="font-mono text-xs text-gray-300 dark:text-gray-700">No image</span>
                </div>
              )}
            </div>

            {/* 情報 */}
            <div className="flex flex-col">
              {/* アクセスバッジ */}
              <div className="mb-3 flex items-center gap-1.5">
                {product.accessStatus === 'fc_only' && <Badge variant="fc" />}
                {product.accessStatus === 'limited' && <Badge variant="limited" />}
              </div>

              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                {product.title}
              </h1>

              <p className="mt-3 font-mono text-lg text-gray-700 dark:text-gray-300">{purchaseSummary}</p>

              <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
                {product.purchaseStatus === 'coming_soon' ? t('store.comingSoonDetail') : t('store.stripeNote')}
              </p>

              {/* 商品説明 */}
              {product.description && (
                <p className="mt-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {product.description}
                </p>
              )}

              {/* FC 限定の説明 */}
              {product.accessStatus === 'fc_only' && (
                <div className="mt-4 rounded-sm border border-violet-100 dark:border-violet-900/30 bg-violet-50/50 dark:bg-violet-950/20 px-3 py-2.5">
                  <p className="font-mono text-[11px] text-violet-600 dark:text-violet-400">
                    {t('store.fcOnlyNote')}
                  </p>
                </div>
              )}

              {/* 補足説明 */}
              {product.externalPurchaseNote && (
                <p className="mt-4 text-xs text-gray-400 dark:text-gray-600">
                  {product.externalPurchaseNote}
                </p>
              )}

              {product.accessStatus !== 'fc_only' && (
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
                  {t('store.fcBridge')}
                </p>
              )}

              {/* 購入導線 */}
              <PurchaseActions product={product} className="mt-8" />

              {/* 注意事項 */}
              <p className="mt-6 text-xs text-gray-300 dark:text-gray-700">
                {t('store.purchaseNote')}
              </p>

              {/* ストアへ戻る */}
              <Link
                to={ROUTES.STORE}
                className="mt-6 inline-flex items-center gap-1 font-mono text-[11px] text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                ← {t('store.backToStore')}
              </Link>
            </div>
          </motion.div>

          {/* 関連商品 */}
          {related.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-20 border-t border-gray-100 dark:border-gray-800 pt-12"
            >
              <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
                {t('store.related')}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </motion.div>
          )}
        </ContentAccessGuard>
      )}
    </section>
  )
}
