import { useAuthClient } from '@/lib/auth/AuthProvider'



export type InternalOrderLookupItem = {
  id: number
  orderNumber: string
  userId: string | null
  billingCustomerId: string | null
  email: string | null
  paymentStatus: string
  orderStatus: string
  fulfillmentStatus: string
  shipmentStatus: string
  returnStatus: string
  refundStatus: string
  totalAmount: number
  currency: string
  orderedAt: string
  syncState: string
}

export type InternalLookupUser = {
  appUserId: string
  logtoUserId: string
  primaryEmail: string | null
  username: string | null
  membershipStatus: string
  membershipPlan: string
  accessLevel: string
  accountStatus: string
  sourceSite: string
  lastLoginAt: string | null
  lastSyncedAt: string | null
}

function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL
  if (!baseUrl) throw new Error('VITE_STRAPI_API_URL が未設定です。')
  return baseUrl.replace(/\/$/, '')
}

async function parseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    const text = await response.text()
    throw new Error(`content-type が不正です: ${contentType} (${text.slice(0, 120)})`)
  }
  return response.json() as Promise<T>
}

async function internalFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}/api${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`internal API エラー (${response.status}): ${body.slice(0, 160)}`)
  }

  return parseJson<T>(response)
}

export function useInternalAdminApi() {
  const auth = useAuthClient()

  async function withToken<T>(runner: (token: string) => Promise<T>): Promise<T> {
    const token = await auth.getAccessToken()
    if (!token) throw new Error('internal admin にはログインが必要です。')
    return runner(token)
  }

  return {
    searchUsers: async (query: string) => withToken((token) => internalFetch<{ count: number; users: InternalLookupUser[] }>(`/internal/users/lookup?email=${encodeURIComponent(query)}`, token)),
    getUserSummary: async (logtoUserId: string) => withToken((token) => internalFetch<any>(`/internal/users/${encodeURIComponent(logtoUserId)}/summary`, token)),
    updateAccountStatus: async (logtoUserId: string, nextStatus: string, reason: string) => withToken((token) => internalFetch<any>(`/internal/users/${encodeURIComponent(logtoUserId)}/account-status`, token, { method: 'POST', body: JSON.stringify({ nextStatus, reason }) })),
    resetNotificationPreference: async (logtoUserId: string, reason: string) => withToken((token) => internalFetch<any>(`/internal/users/${encodeURIComponent(logtoUserId)}/notification-reset`, token, { method: 'POST', body: JSON.stringify({ reason }) })),
    searchOrders: async (query: string) => withToken((token) => internalFetch<{ count: number; items: InternalOrderLookupItem[] }>(`/internal/orders/lookup?query=${encodeURIComponent(query)}`, token)),
  }
}
