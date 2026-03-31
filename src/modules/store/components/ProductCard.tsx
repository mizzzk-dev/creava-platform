import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { detailPath } from '@/lib/routes'
import { formatPrice } from '@/utils'
import type { ShopifyProductSummary } from '@/lib/shopify/types'

interface Props {
  product: ShopifyProductSummary
}

export default function ProductCard({ product }: Props) {
  const { t } = useTranslation()

  return (
    <Link to={detailPath.product(product.handle)} className="group block">
      <div className="aspect-square overflow-hidden bg-gray-100">
        {product.featuredImage ? (
          <img
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
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
          {formatPrice(
            product.priceRange.minVariantPrice.amount,
            product.priceRange.minVariantPrice.currencyCode,
          )}
        </p>
        {!product.availableForSale && (
          <p className="text-xs text-gray-400">{t('store.outOfStock')}</p>
        )}
      </div>
    </Link>
  )
}
