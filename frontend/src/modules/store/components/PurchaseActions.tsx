import { useTranslation } from 'react-i18next'
import { getPurchaseMode } from '../utils/purchase'
import type { StoreProductSummary } from '../types'

interface Props {
  product: Pick<StoreProductSummary, 'stripeLink' | 'baseLink' | 'purchaseStatus'>
  className?: string
}

/**
 * 商品ごとの購入導線ボタン群
 *
 * 表示ルール:
 * - stripe_and_base : 「今すぐ購入（Stripe）」+ 「PayPay/Amazon Pay はこちら（BASE）」
 * - stripe_only     : 「今すぐ購入」のみ
 * - base_only       : 「購入する」のみ
 * - unavailable     : 「完売」or「販売準備中」テキスト
 *
 * 将来 Shopify に移行する場合は getPurchaseMode と本コンポーネントを差し替える
 */
export default function PurchaseActions({ product, className = '' }: Props) {
  const { t } = useTranslation()
  const mode = getPurchaseMode(product)

  if (mode === 'unavailable') {
    const label =
      product.purchaseStatus === 'soldout' ? t('store.soldOut') : t('store.comingSoon')
    return <p className={`text-sm text-gray-400 ${className}`}>{label}</p>
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* メイン購入ボタン（Stripe 優先） */}
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

      {/* BASE のみの場合のメインボタン */}
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

      {/* サブ導線：BASE（Stripe + BASE 両方ある場合のみ） */}
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
