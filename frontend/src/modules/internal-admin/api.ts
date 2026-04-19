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

export type InternalRevenueSummary = {
  count: number
  currency: string
  totals: {
    gross: number
    net: number
    refund: number
    shipping: number
    discount: number
    tax: number
  }
  counts: {
    failed: number
    canceled: number
    refunded: number
  }
  bySourceSite: Array<{ sourceSite: string; gross: number; net: number; refund: number; records: number }>
  byRevenueType: Array<{ revenueType: string; gross: number; net: number; refund: number; records: number }>
}

export type InternalBiOverview = {
  range: { from: string; to: string }
  freshnessState: Record<string, string | null>
  sourceOfTruth: Record<string, string>
  syncState: { revenue: Array<[string, number]> }
  kpi: {
    acquisition: { sessions: number; newUsers: number; trafficByReferrer: Array<[string, number]> }
    conversion: {
      mainToStoreRate: number
      mainToFcRate: number
      checkoutStartRate: number
      purchaseCompleteRate: number
      fcJoinCompleteRate: number
      formCompletionRate: number
    }
    retention: {
      revisitUsers: number
      notificationRevisitEvents: number
      activeMembershipCount: number
      graceMembershipCount: number
    }
    revenue: {
      gross: number
      net: number
      refund: number
      refundRate: number
      averageOrderValue: number
      subscriptionRevenue: number
    }
    support: {
      totalInquiries: number
      byCategory: Array<{ category: string; count: number }>
    }
  }
  summaryTable: {
    monthly: Array<{ month: string; gross: number; net: number; refund: number }>
    daily: Array<{ day: string; sessions: number; checkout: number; formSuccess: number }>
    bySite: Array<{ site: string; sessions: number; paidOrders: number; netRevenue: number; supportCases: number }>
    byLocale: Array<{ locale: string; events: number }>
    byCampaign: Array<{ campaignId: string; orders: number; gross: number }>
    notificationPerformance: { sent: number; failed: number; clicked: number }
  }
}

export type InternalBiCohorts = {
  range: { from: string; to: string }
  cohortKey: string[]
  retentionWindow: string[]
  cohorts: {
    signup: Array<{ cohortKey: string; users: number; retained30d: number; retained60d: number; supportCases: number }>
    firstPurchase: Array<{ cohortKey: string; orders: number; revenue: number; refundCases: number }>
    membership: Array<{ cohortKey: string; joinCount: number; canceledCount: number; graceCount: number; activeCount: number }>
    supportImpact: Array<{ cohortKey: string; supportCases: number; unresolved: number }>
  }
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
    getRevenueSummary: async (sourceSite?: string) => withToken((token) => internalFetch<InternalRevenueSummary>(`/internal/revenue/summary${sourceSite ? `?sourceSite=${encodeURIComponent(sourceSite)}` : ''}`, token)),
    getBiOverview: async (from?: string, to?: string) => withToken((token) => {
      const query = new URLSearchParams()
      if (from) query.set('from', from)
      if (to) query.set('to', to)
      return internalFetch<InternalBiOverview>(`/internal/bi/overview${query.toString() ? `?${query.toString()}` : ''}`, token)
    }),
    getBiCohorts: async (from?: string, to?: string) => withToken((token) => {
      const query = new URLSearchParams()
      if (from) query.set('from', from)
      if (to) query.set('to', to)
      return internalFetch<InternalBiCohorts>(`/internal/bi/cohorts${query.toString() ? `?${query.toString()}` : ''}`, token)
    }),
    downloadBiCsv: async (from?: string, to?: string) => withToken(async (token) => {
      const query = new URLSearchParams()
      if (from) query.set('from', from)
      if (to) query.set('to', to)
      const path = `/internal/bi/export.csv${query.toString() ? `?${query.toString()}` : ''}`
      const response = await fetch(`${getApiBaseUrl()}/api${path}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) throw new Error(`BI CSV エクスポートに失敗しました: ${response.status}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bi-overview-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    }),
    downloadRevenueCsv: async (sourceSite?: string) => withToken(async (token) => {
      const path = `/internal/revenue/export.csv${sourceSite ? `?sourceSite=${encodeURIComponent(sourceSite)}` : ''}`
      const response = await fetch(`${getApiBaseUrl()}/api${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`CSV エクスポートに失敗しました: ${response.status}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `revenue-records-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    }),
  }
}
