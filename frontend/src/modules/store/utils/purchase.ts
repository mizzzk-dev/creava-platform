import type { StoreProductSummary } from '../types'

/**
 * 購入導線モード
 *
 * - stripe_and_base : Stripe + BASE 両方あり（メイン: Stripe、サブ: BASE）
 * - stripe_only     : Stripe のみ
 * - base_only       : BASE のみ
 * - unavailable     : どちらもない / 完売 / 販売準備中
 */
export type PurchaseMode = 'stripe_and_base' | 'stripe_only' | 'base_only' | 'unavailable'

/**
 * 商品の購入導線モードを判定する
 *
 * 判定ルール:
 * 1. purchaseStatus が 'available' 以外 → unavailable
 * 2. stripeLink + baseLink 両方あり → stripe_and_base
 * 3. stripeLink のみ → stripe_only
 * 4. baseLink のみ → base_only
 * 5. どちらもない → unavailable
 *
 * 将来 Shopify に移行する場合はここを差し替える
 */
export function getPurchaseMode(
  product: Pick<StoreProductSummary, 'stripeLink' | 'baseLink' | 'purchaseStatus'>,
): PurchaseMode {
  if (product.purchaseStatus !== 'available') return 'unavailable'
  const hasStripe = !!product.stripeLink
  const hasBase = !!product.baseLink
  if (hasStripe && hasBase) return 'stripe_and_base'
  if (hasStripe) return 'stripe_only'
  if (hasBase) return 'base_only'
  return 'unavailable'
}
