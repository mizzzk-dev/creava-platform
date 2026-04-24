import { trackMizzzEvent } from '@/modules/analytics/tracking'
import { postPaymentsJson } from '@/lib/stripe/checkout'

interface CheckoutSessionResponse {
  url: string
  sessionId: string
}

export async function createStoreCheckoutSession(input: {
  productId: string
  quantity: number
  locale: string
  userId?: string | null
}): Promise<CheckoutSessionResponse> {
  trackMizzzEvent('store_checkout_started', { productId: input.productId, quantity: input.quantity })

  if (import.meta.env.VITE_CMS_PROVIDER === 'wordpress') {
    return postPaymentsJson<CheckoutSessionResponse>('/checkout/session', {
      productId: input.productId,
      quantity: input.quantity,
      locale: input.locale,
      userId: input.userId ?? null,
    })
  }

  return postPaymentsJson<CheckoutSessionResponse>('/store/checkout-session', input)
}

export async function createFanclubCheckoutSession(input: {
  planId: string
  locale: string
  authToken: string
}): Promise<CheckoutSessionResponse> {
  trackMizzzEvent('fanclub_checkout_started', { planId: input.planId })

  if (import.meta.env.VITE_CMS_PROVIDER === 'wordpress') {
    return postPaymentsJson<CheckoutSessionResponse>('/checkout/session', {
      planId: input.planId,
      locale: input.locale,
      membership: true,
    }, input.authToken)
  }

  return postPaymentsJson<CheckoutSessionResponse>(
    '/fanclub/checkout-session',
    { planId: input.planId, locale: input.locale },
    input.authToken,
  )
}

export async function createCustomerPortalSession(input: { authToken: string }): Promise<{ url: string }> {
  trackMizzzEvent('customer_portal_started')
  return import.meta.env.VITE_CMS_PROVIDER === 'wordpress'
    ? postPaymentsJson<{ url: string }>('/billing/portal', {}, input.authToken)
    : postPaymentsJson<{ url: string }>('/customer-portal/session', {}, input.authToken)
}
