import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { detailPath } from '@/lib/routeConstants'
import { formatPriceNum } from '@/utils'
import { convertPrice, type DisplayCurrency } from '../lib/currency'
import Badge from '@/components/common/Badge'
import type { StoreProductSummary } from '../types'
import { trackCtaClick } from '@/modules/analytics/tracking'

interface Props {
  product: StoreProductSummary
  displayCurrency?: DisplayCurrency
  trackingLocation?: string
}

export default function ProductCard({ product, displayCurrency = 'JPY', trackingLocation = 'store_product_card' }: Props) {
  const { t } = useTranslation()
  const isUnavailable = product.purchaseStatus !== 'available'

  const statusLabel =
    product.purchaseStatus === 'soldout'
      ? t('store.soldOut')
      : product.purchaseStatus === 'coming_soon'
        ? t('store.comingSoon')
        : formatPriceNum(convertPrice(product.price, product.currency, displayCurrency), displayCurrency)

  return (
    <Link
      to={detailPath.product(product.slug)}
      onClick={() => trackCtaClick(trackingLocation, 'product_click', { slug: product.slug, status: product.purchaseStatus })}
      className="group block"
      aria-label={`${product.title} ${t('store.detailCta')}`}
    >
      <article className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 shadow-sm shadow-gray-200/40 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-black/20">
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          <div className="absolute left-3 top-3 z-10 rounded-full border border-white/70 bg-white/70 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500 backdrop-blur dark:border-white/20 dark:bg-gray-900/70 dark:text-gray-300">
            curated
          </div>
          {product.previewImage ? (
            <img
              src={product.previewImage.url}
              alt={product.previewImage.alt ?? product.title}
              className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${isUnavailable ? 'opacity-60 grayscale' : ''}`}
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-mono text-[10px] text-gray-300 dark:text-gray-700">no image</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
            {product.campaignType === 'drop' && <Badge variant="featured" size="sm" label="DROP" />}
            {product.campaignType === 'restock' && <Badge variant="new" size="sm" label="RESTOCK" />}
            {product.pickup && <Badge variant="pickup" size="sm" />}
            {product.isTrending && <Badge variant="featured" size="sm" label="TRENDING" />}
            {product.purchaseStatus === 'soldout' && <Badge variant="soldout" size="sm" />}
            {product.purchaseStatus === 'coming_soon' && <Badge variant="coming_soon" size="sm" />}
            {product.isNewArrival && <Badge variant="new" size="sm" />}
            {product.isLimited && <Badge variant="limited" size="sm" label="LIMITED" />}
          </div>

          <div className="absolute bottom-2 left-2 flex items-center gap-1">
            {product.accessStatus === 'fc_only' && <Badge variant="fc" size="sm" label="MEMBERS" />}
            {product.accessStatus === 'limited' && <Badge variant="limited" size="sm" />}
            {product.earlyAccess && <Badge variant="early" size="sm" label={t('store.badgeEarly', { defaultValue: '先行' })} />}
            {product.memberBenefit && <Badge variant="benefit" size="sm" label={t('store.badgeBenefit', { defaultValue: '特典' })} />}
          </div>
        </div>

        <div className="space-y-1.5 px-3.5 py-3.5">
          <h3 className="line-clamp-2 text-sm font-medium leading-relaxed text-gray-900 transition-colors group-hover:text-gray-600 dark:text-gray-100 dark:group-hover:text-gray-300">
            {product.title}
          </h3>
          <p className="font-mono text-xs text-gray-500 dark:text-gray-400">{statusLabel}</p>
          {product.shortHighlight && (
            <p className="line-clamp-2 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{product.shortHighlight}</p>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="line-clamp-1 text-[11px] text-gray-500 dark:text-gray-500">
              {product.accessStatus === 'fc_only'
                ? t('store.fcOnlyNote')
                : t('store.detailHint', { defaultValue: '購入条件を確認' })}
            </span>
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {product.stock > 0 ? `在庫 ${product.stock}` : '在庫なし'}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
