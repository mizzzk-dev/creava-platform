import { getStripeClient, getStripeMode } from '../../../lib/stripe/client'
import { assertStripeEnv, getCheckoutUrlByKind, getPortalReturnUrl, type StripeCheckoutKind } from '../../../lib/stripe/env'
import { buildIdempotencyKey } from '../../../lib/stripe/idempotency'

export type StoreCheckoutInput = {
  productDocumentId: string
  productId: number
  title: string
  currency: string
  unitAmount: number
  quantity: number
  userId: string | null
  locale: string
}

export type FanclubCheckoutInput = {
  planDocumentId: string
  planId: number
  planName: string
  stripePriceId: string
  userId: string
  locale: string
}

export async function createStoreCheckoutSession(input: StoreCheckoutInput) {
  assertStripeEnv()

  const stripe = getStripeClient()
  const { successUrl, cancelUrl } = getCheckoutUrlByKind('store')
  const idempotencyKey = buildIdempotencyKey('store_checkout', {
    productDocumentId: input.productDocumentId,
    productId: input.productId,
    quantity: input.quantity,
    userId: input.userId,
  })

  const metadata = {
    checkoutKind: 'store',
    productDocumentId: input.productDocumentId,
    productId: String(input.productId),
    userId: input.userId ?? 'guest',
    locale: input.locale,
  }

  return stripe.checkout.sessions.create(
    {
      mode: 'payment',
      locale: input.locale as 'auto',
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          quantity: input.quantity,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.unitAmount,
            product_data: {
              name: input.title,
              metadata,
            },
          },
        },
      ],
      metadata,
      payment_intent_data: {
        metadata,
      },
      allow_promotion_codes: true,
    },
    { idempotencyKey },
  )
}

export async function createFanclubCheckoutSession(input: FanclubCheckoutInput) {
  assertStripeEnv()

  const stripe = getStripeClient()
  const { successUrl, cancelUrl } = getCheckoutUrlByKind('fanclub')
  const idempotencyKey = buildIdempotencyKey('fanclub_checkout', {
    planDocumentId: input.planDocumentId,
    planId: input.planId,
    userId: input.userId,
  })

  const metadata = {
    checkoutKind: 'fanclub',
    planDocumentId: input.planDocumentId,
    planId: String(input.planId),
    userId: input.userId,
    locale: input.locale,
  }

  return stripe.checkout.sessions.create(
    {
      mode: 'subscription',
      locale: input.locale as 'auto',
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [{ price: input.stripePriceId, quantity: 1 }],
      metadata,
      subscription_data: {
        metadata,
      },
      allow_promotion_codes: true,
    },
    { idempotencyKey },
  )
}

export async function createCustomerPortalSession(customerId: string) {
  assertStripeEnv()
  const stripe = getStripeClient()
  const idempotencyKey = buildIdempotencyKey('customer_portal', {
    customerId,
    mode: getStripeMode(),
  })

  return stripe.billingPortal.sessions.create(
    {
      customer: customerId,
      return_url: getPortalReturnUrl(),
    },
    { idempotencyKey },
  )
}
