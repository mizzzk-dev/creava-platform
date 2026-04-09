import { trackMizzzEvent } from '@/modules/analytics/tracking'

interface CheckoutSessionResponse {
  url: string
  sessionId: string
}

function getApiBase(): string {
  const base = import.meta.env.VITE_STRAPI_API_URL
  if (!base) {
    throw new Error('VITE_STRAPI_API_URL が未設定です。')
  }
  return `${base.replace(/\/$/, '')}/api`
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

export async function createStoreCheckoutSession(input: {
  productId: string
  quantity: number
  locale: string
  userId?: string | null
}): Promise<CheckoutSessionResponse> {
  trackMizzzEvent('store_checkout_started', { productId: input.productId, quantity: input.quantity })
  return postJson<CheckoutSessionResponse>('/payments/store/checkout-session', input)
}

export async function createFanclubCheckoutSession(input: {
  planId: string
  locale: string
  userId: string
}): Promise<CheckoutSessionResponse> {
  trackMizzzEvent('fanclub_checkout_started', { planId: input.planId })
  return postJson<CheckoutSessionResponse>('/payments/fanclub/checkout-session', input)
}

export async function createCustomerPortalSession(input: { customerId: string }): Promise<{ url: string }> {
  trackMizzzEvent('customer_portal_started', { customerId: input.customerId })
  return postJson<{ url: string }>('/payments/customer-portal/session', input)
}
