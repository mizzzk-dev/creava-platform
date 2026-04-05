import { useTranslation } from 'react-i18next'
import { getPurchaseMode } from '../utils/purchase'
import type { StoreProductSummary } from '../types'

interface Props {
  product: Pick<StoreProductSummary, 'stripeLink' | 'baseLink' | 'purchaseStatus'>
  className?: string
  onAddToCart?: () => void
}

export default function PurchaseActions({ product, className = '', onAddToCart }: Props) {
  const { t } = useTranslation()
  const mode = getPurchaseMode(product)

  if (mode === 'unavailable') {
    const label =
      product.purchaseStatus === 'soldout' ? t('store.soldOut') : t('store.comingSoon')
    return <p className={`text-sm text-gray-400 ${className}`}>{label}</p>
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {(mode === 'stripe_and_base' || mode === 'stripe_only') && (
        <a
          href={product.stripeLink!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-gray-900 px-6 py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-gray-700"
        >
          {t('store.buyNow')}
        </a>
      )}

      {mode === 'base_only' && (
        <a
          href={product.baseLink!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-gray-900 px-6 py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-gray-700"
        >
          {t('store.buyOn')}
        </a>
      )}

      {onAddToCart && (
        <button
          type="button"
          onClick={onAddToCart}
          className="inline-flex items-center justify-center border border-gray-200 dark:border-gray-700 px-6 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
        >
          {t('cart.add', { defaultValue: 'カートに追加' })}
        </button>
      )}

      {mode === 'stripe_and_base' && (
        <a
          href={product.baseLink!}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-xs text-gray-400 underline-offset-2 transition-colors hover:text-gray-700 hover:underline"
        >
          {t('store.buyOnBase')}
        </a>
      )}
    </div>
  )
}
