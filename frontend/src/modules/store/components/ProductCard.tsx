import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { detailPath } from '@/lib/routeConstants'
import { formatPriceNum } from '@/utils'
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
      <div className="relative aspect-square overflow-hidden bg-gray-100">
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
            <span className="font-mono text-[10px] text-gray-300">no image</span>
          </div>
        )}

        {/* status badge — top-right */}
        {product.purchaseStatus === 'soldout' && (
          <span className="absolute right-2 top-2 rounded-sm bg-gray-900/80 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-300">
            {t('store.soldOut')}
          </span>
        )}
        {product.purchaseStatus === 'coming_soon' && (
          <span className="absolute right-2 top-2 rounded-sm bg-amber-500/90 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
            {t('store.comingSoon')}
          </span>
        )}
      </div>

      {/* meta */}
      <div className="mt-3 space-y-0.5">
        <h3 className="text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-500">
          {product.title}
        </h3>
        <p className="font-mono text-xs text-gray-400">
          {formatPriceNum(product.price, product.currency)}
        </p>
      </div>
    </Link>
  )
}
