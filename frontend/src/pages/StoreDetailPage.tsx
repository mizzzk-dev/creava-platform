import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useProductDetail } from '@/modules/store/hooks/useProductDetail'
import { useProductList } from '@/modules/store/hooks/useProductList'
import PurchaseActions from '@/modules/store/components/PurchaseActions'
import ProductCard from '@/modules/store/components/ProductCard'
import { formatPriceNum } from '@/utils'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import { isStoreSite } from '@/lib/siteLinks'
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import ContentAccessGuard from '@/components/guards/ContentAccessGuard'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import SkeletonProductDetail from '@/components/common/SkeletonProductDetail'
import Badge from '@/components/common/Badge'
import MemberGuideCard from '@/components/common/MemberGuideCard'
import type { PurchaseStatus } from '@/modules/store/types'
import { useCart } from '@/modules/cart/context'
import { convertPrice, DISPLAY_CURRENCIES } from '@/modules/store/lib/currency'
import { useDisplayCurrency } from '@/modules/store/hooks/useDisplayCurrency'
import RestockNotifyForm from '@/modules/store/components/RestockNotifyForm'
import { trackViewHistory } from '@/modules/store/lib/commerceOptimization'
import { trackCtaClick } from '@/modules/analytics/tracking'

function purchaseStatusToAvailability(status: PurchaseStatus): 'InStock' | 'OutOfStock' | 'PreOrder' {
  if (status === 'available') return 'InStock'
  if (status === 'soldout') return 'OutOfStock'
  return 'PreOrder'
}

export default function StoreDetailPage() {
  const { handle } = useParams<{ handle: string }>()
  const { t } = useTranslation()
  const { product, loading, error, notFound, refetch } = useProductDetail(handle)
  const { products } = useProductList(8)
  const { addItem } = useCart()
  const { currency, updateCurrency } = useDisplayCurrency('JPY')

  const canAddCart = product?.purchaseStatus === 'available' && product?.accessStatus !== 'fc_only'

  // 関連商品: 同一 accessStatus で現在商品を除く最大4件
  const related = products
    .filter((p) => p.slug !== handle && p.accessStatus === 'public')
    .slice(0, 4)

  const productUrl = `${SITE_URL}${detailPath.product(handle ?? '')}`
  const storeListPath = isStoreSite ? ROUTES.STORE_PRODUCTS : ROUTES.STORE
  const cartPath = isStoreSite ? ROUTES.STORE_CART : ROUTES.CART


  useEffect(() => {
    if (!product) return
    trackViewHistory('product', product.slug)
  }, [product])

  const purchaseSummary =
    product?.purchaseStatus === 'soldout'
      ? t('store.soldOut')
      : product?.purchaseStatus === 'coming_soon'
        ? t('store.comingSoon')
        : product
          ? formatPriceNum(convertPrice(product.price, product.currency, currency), currency)
          : ''

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      {/* breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 font-mono text-[11px] text-gray-400 dark:text-gray-600">
        <Link to={storeListPath} className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          {t('store.title')}
        </Link>
        <span className="select-none">/</span>
        <span className="text-gray-500 dark:text-gray-500 truncate max-w-xs">{product?.title ?? '...'}</span>
      </nav>

      {loading && <SkeletonProductDetail />}
      {error && <ErrorState message={error} onRetry={refetch} location="store_detail" />}
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
                { name: t('store.title'), url: `${SITE_URL}${storeListPath}` },
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
            className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_0.95fr]"
          >
            {/* 画像 */}
            <div className="sticky top-24 aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
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
            <div className="flex flex-col rounded-2xl border border-gray-200/70 bg-white/80 p-5 dark:border-gray-800 dark:bg-gray-900/60 sm:p-7">
              {/* アクセスバッジ */}
              <div className="mb-3 flex items-center gap-1.5">
                {product.accessStatus === 'fc_only' && <Badge variant="fc" />}
                {product.accessStatus === 'limited' && <Badge variant="limited" />}
              </div>

              <h1 className="text-2xl font-semibold leading-snug text-gray-900 dark:text-gray-100 sm:text-3xl">
                {product.title}
              </h1>

              <p className="mt-4 font-mono text-xl text-gray-700 dark:text-gray-200">{purchaseSummary}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {product.stock > 0 ? `在庫: ${product.stock}` : '在庫なし'}
              </p>
              <div className="mt-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">
                  {t('store.currencyLabel', { defaultValue: '表示通貨' })}
                  <select
                    value={currency}
                    onChange={(event) => updateCurrency(event.target.value as typeof currency)}
                    className="ml-2 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  >
                    {DISPLAY_CURRENCIES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

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

              <div className="mt-5">
                <MemberGuideCard />
              </div>

              {/* 補足説明 */}
              {product.externalPurchaseNote && (
                <p className="mt-4 text-xs text-gray-400 dark:text-gray-600">
                  {product.externalPurchaseNote}
                </p>
              )}
              {product.cautionNotes && (
                <div className="mt-3 rounded border border-amber-200/70 bg-amber-50/70 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                  注意事項: {product.cautionNotes}
                </div>
              )}
              {product.shippingNotes && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">配送情報: {product.shippingNotes}</p>
              )}
              {product.digitalDeliveryNotes && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">デジタル商品案内: {product.digitalDeliveryNotes}</p>
              )}

              {product.accessStatus !== 'fc_only' && (
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
                  {t('store.fcBridge')}
                </p>
              )}

              {/* 購入導線 */}
              <div className="sticky bottom-4 mt-8 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-lg shadow-gray-200/70 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 dark:shadow-black/30">
                <PurchaseActions
                  product={product}
                  className="mt-0"
                  onAddToCart={canAddCart ? () => addItem(product, 1) : undefined}
                />
              </div>
              {product.purchaseStatus === 'soldout' && (
                <RestockNotifyForm
                  productId={product.id}
                  productSlug={product.slug}
                  productTitle={product.title}
                />
              )}

              <Link
                to={cartPath}
                onClick={() => trackCtaClick('store_detail', 'go_to_cart', { slug: product.slug })}
                className="mt-3 inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {t('cart.goToCart', { defaultValue: 'カートへ進む' })} →
              </Link>

              {product.accessStatus === 'fc_only' && (
                <Link
                  to={ROUTES.MEMBER}
                  onClick={() => trackCtaClick('store_detail', 'fc_member_check', { slug: product.slug })}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-mono text-violet-500 hover:text-violet-400"
                >
                  {t('store.fcMemberCheck', { defaultValue: '会員状態を確認する' })} →
                </Link>
              )}

              {/* 注意事項 */}
              <p className="mt-6 text-xs text-gray-300 dark:text-gray-700">
                {t('store.purchaseNote')}
              </p>

              {/* ストアへ戻る */}
              <Link
                to={storeListPath}
                onClick={() => trackCtaClick('store_detail', 'back_to_store')}
                className="mt-8 inline-flex items-center gap-1 font-mono text-[11px] text-gray-400 transition-colors hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-300"
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
                  <ProductCard key={p.id} product={p} displayCurrency={currency} trackingLocation="store_detail_related" />
                ))}
              </div>
            </motion.div>
          )}
        </ContentAccessGuard>
      )}
    </section>
  )
}
