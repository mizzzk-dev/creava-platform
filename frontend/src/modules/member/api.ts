import { createMockMemberDashboardData } from './mock'
import { loadMemberAccountSettings, loadMemberPreferences, loadWithdrawRequested, saveMemberAccountSettings, saveMemberPreferences, saveWithdrawRequested } from './storage'
import type { MemberAccountSettings, MemberDashboardData, MemberPreferences } from './types'
import { fetchCollection } from '@/lib/api/strapi'
import { isStrapiForbiddenError } from '@/lib/api/fallback'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { StrapiApiError } from '@/lib/api/client'

const USE_MOCK = !import.meta.env.VITE_STRAPI_API_URL
const MEMBER_PAGE_SIZE = 10

export type MemberBillingSummary = {
  membership: {
    membershipPlan: 'free' | 'standard' | 'premium'
    membershipStatus: 'guest' | 'active' | 'grace_period' | 'paused' | 'cancelled'
    accessLevel: 'public' | 'logged_in' | 'member' | 'premium' | 'admin'
  }
  billingSummary: {
    subscriptionStatus: string
    billingStatus: string
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    canceledAt: string | null
    renewalDate: string | null
    syncState: string
    sourceOfTruth: string
  } | null
  entitlementSummary: {
    entitlementState: string
    entitlementSet: Record<string, boolean>
    earlyAccessEligibility: boolean
    sourceOfTruth: string
    syncState: string
  } | null
}

export async function getMemberBillingSummary(authToken: string): Promise<MemberBillingSummary> {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL
  if (!baseUrl) {
    return {
      membership: { membershipPlan: 'free', membershipStatus: 'guest', accessLevel: 'logged_in' },
      billingSummary: null,
      entitlementSummary: null,
    }
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/user-sync/me`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`billing summary API error: ${response.status}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    const raw = await response.text()
    throw new Error(`billing summary API content-type が不正です: ${contentType} (${raw.slice(0, 120)})`)
  }

  const json = await response.json() as any
  return {
    membership: json.membership,
    billingSummary: json.billingSummary ?? null,
    entitlementSummary: json.entitlementSummary ?? null,
  }
}


async function getMemberOrdersAndShipments(authToken: string): Promise<Pick<MemberDashboardData, 'orders' | 'shipments'>> {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL
  if (!baseUrl) return { orders: [], shipments: [] }

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${authToken}`,
  }

  const [orderRes, shipmentRes] = await Promise.all([
    fetch(`${baseUrl.replace(/\/$/, '')}/api/orders/me?pageSize=${MEMBER_PAGE_SIZE}`, { headers }),
    fetch(`${baseUrl.replace(/\/$/, '')}/api/orders/me/shipments?pageSize=${MEMBER_PAGE_SIZE}`, { headers }),
  ])

  if (!orderRes.ok || !shipmentRes.ok) {
    throw new Error('注文情報の取得に失敗しました。')
  }

  const [orderJson, shipmentJson] = await Promise.all([orderRes.json() as Promise<{ data: MemberDashboardData['orders'] }>, shipmentRes.json() as Promise<{ data: MemberDashboardData['shipments'] }>])
  return { orders: orderJson.data ?? [], shipments: shipmentJson.data ?? [] }
}
export async function getMemberDashboard(isMember: boolean, authToken?: string | null): Promise<MemberDashboardData> {
  if (USE_MOCK) {
    const mock = createMockMemberDashboardData(isMember)
    const saved = loadMemberPreferences()
    mock.withdrawRequested = loadWithdrawRequested()
    if (saved) {
      mock.preferences = saved
    }
    return mock
  }

  try {
    const [orderData, notices, auditLogs] = await Promise.all([
      authToken
        ? getMemberOrdersAndShipments(authToken)
        : Promise.all([
          fetchCollection<MemberDashboardData['orders'][number]>(API_ENDPOINTS.memberOrders, {
            sort: ['orderedAt:desc'],
            pagination: { pageSize: MEMBER_PAGE_SIZE },
          }),
          fetchCollection<MemberDashboardData['shipments'][number]>(API_ENDPOINTS.memberShipments, {
            sort: ['lastSyncedAt:desc'],
            pagination: { pageSize: MEMBER_PAGE_SIZE },
          }),
        ]).then(([orders, shipments]) => ({ orders: orders.data, shipments: shipments.data })),
      fetchCollection<MemberDashboardData['notices'][number]>(API_ENDPOINTS.memberNotices, {
        sort: ['publishedAt:desc'],
        pagination: { pageSize: MEMBER_PAGE_SIZE },
      }),
      fetchCollection<MemberDashboardData['auditLogs'][number]>(API_ENDPOINTS.memberAuditLogs, {
        sort: ['createdAt:desc'],
        pagination: { pageSize: MEMBER_PAGE_SIZE },
      }),
    ])

    const saved = loadMemberPreferences()
    return {
      orders: orderData.orders,
      shipments: orderData.shipments,
      notices: notices.data,
      preferences: saved ?? { newsletterOptIn: true, loginAlertOptIn: true },
      auditLogs: auditLogs.data,
      withdrawRequested: loadWithdrawRequested(),
      loyaltyProfile: createMockMemberDashboardData(isMember).loyaltyProfile,
    }
  } catch (error) {
    if (isStrapiForbiddenError(error) || (error instanceof StrapiApiError && error.status === 404)) {
      const mock = createMockMemberDashboardData(isMember)
      const saved = loadMemberPreferences()
      mock.withdrawRequested = loadWithdrawRequested()
      if (saved) {
        mock.preferences = saved
      }
      return mock
    }
    throw error
  }
}

export async function requestWithdraw(): Promise<boolean> {
  saveWithdrawRequested(true)
  return true
}

export async function clearWithdrawRequest(): Promise<boolean> {
  saveWithdrawRequested(false)
  return false
}

export async function updateMemberPreferences(preferences: MemberPreferences): Promise<MemberPreferences> {
  saveMemberPreferences(preferences)
  return preferences
}

export async function getMemberAccountSettings(user: { id: string | null; email: string | null } | null): Promise<MemberAccountSettings> {
  const settings = loadMemberAccountSettings()
  const seeded = {
    ...settings,
    profile: {
      ...settings.profile,
      userId: settings.profile.userId || user?.id || 'guest-user',
      email: settings.profile.email || user?.email || '',
    },
  }

  if (
    seeded.profile.userId !== settings.profile.userId
    || seeded.profile.email !== settings.profile.email
  ) {
    saveMemberAccountSettings(seeded)
  }

  return seeded
}

export async function updateMemberAccountSettings(settings: MemberAccountSettings): Promise<MemberAccountSettings> {
  saveMemberAccountSettings(settings)
  return settings
}
