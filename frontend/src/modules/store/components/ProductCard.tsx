import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { detailPath } from '@/lib/routeConstants'
import { formatPriceNum } from '@/utils'
import Badge from '@/components/common/Badge'
import type { StoreProductSummary } from '../types'

interface Props {
  product: StoreProductSummary
}

export default function ProductCard({ product }: Props) {
  const { t } = useTranslation()
  const isUnavailable = product.purchaseStatus !== 'available'

  return (
    <Link to={detailPath.product(product.slug)} className="group block">
      {/* image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        {product.previewImage ? (
          <img
            src={product.previewImage.url}
            alt={product.previewImage.alt ?? product.title}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isUnavailable ? 'opacity-50 grayscale' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-[10px] text-gray-300 dark:text-gray-700">no image</span>
          </div>
        )}

        {/* status badge — top-right */}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {product.purchaseStatus === 'soldout' && (
            <span className="rounded-sm bg-gray-900/80 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-300">
              {t('store.soldOut')}
            </span>
          )}
          {product.purchaseStatus === 'coming_soon' && (
            <span className="rounded-sm bg-amber-500/90 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
              {t('store.comingSoon')}
            </span>
          )}
        </div>

        {/* access badges — bottom-left */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          {product.accessStatus === 'fc_only' && <Badge variant="fc" size="sm" />}
          {product.accessStatus === 'limited' && <Badge variant="limited" size="sm" />}
        </div>
      </div>

      {/* meta */}
      <div className="mt-3 space-y-0.5">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors group-hover:text-gray-500 dark:group-hover:text-gray-400 line-clamp-2">
          {product.title}
        </h3>
        <p className="font-mono text-xs text-gray-400 dark:text-gray-600">
          {product.purchaseStatus === 'soldout'
            ? t('store.soldOut')
            : product.purchaseStatus === 'coming_soon'
              ? t('store.comingSoon')
              : formatPriceNum(product.price, product.currency)}
        </p>
      </div>
    </Link>
  )
}
