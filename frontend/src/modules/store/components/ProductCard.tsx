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

  return (
    <Link to={detailPath.product(product.slug)} className="group block">
      <div className="aspect-square overflow-hidden bg-gray-100">
        {product.previewImage ? (
          <img
            src={product.previewImage.url}
            alt={product.previewImage.alt ?? product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs text-gray-300">No image</span>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-500">
          {product.title}
        </h3>
        <p className="text-sm text-gray-500">
          {formatPriceNum(product.price, product.currency)}
        </p>
        {product.purchaseStatus === 'soldout' && (
          <p className="text-xs text-gray-400">{t('store.soldOut')}</p>
        )}
        {product.purchaseStatus === 'coming_soon' && (
          <p className="text-xs text-gray-400">{t('store.comingSoon')}</p>
        )}
      </div>
    </Link>
  )
}
