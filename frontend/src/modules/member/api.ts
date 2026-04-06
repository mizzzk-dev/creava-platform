import { createMockMemberDashboardData } from './mock'
import { loadMemberAccountSettings, loadMemberPreferences, loadWithdrawRequested, saveMemberAccountSettings, saveMemberPreferences, saveWithdrawRequested } from './storage'
import type { MemberAccountSettings, MemberDashboardData, MemberPreferences } from './types'
import { fetchCollection } from '@/lib/api/strapi'
import { isStrapiForbiddenError } from '@/lib/api/fallback'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { StrapiApiError } from '@/lib/api/client'

const USE_MOCK = !import.meta.env.VITE_STRAPI_API_URL
const MEMBER_PAGE_SIZE = 10

export async function getMemberDashboard(isMember: boolean): Promise<MemberDashboardData> {
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
    const [orders, shipments, notices, auditLogs] = await Promise.all([
      fetchCollection<MemberDashboardData['orders'][number]>(API_ENDPOINTS.memberOrders, {
        sort: ['orderedAt:desc'],
        pagination: { pageSize: MEMBER_PAGE_SIZE },
      }),
      fetchCollection<MemberDashboardData['shipments'][number]>(API_ENDPOINTS.memberShipments, {
        sort: ['lastSyncedAt:desc'],
        pagination: { pageSize: MEMBER_PAGE_SIZE },
      }),
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
      orders: orders.data,
      shipments: shipments.data,
      notices: notices.data,
      preferences: saved ?? { newsletterOptIn: true, loginAlertOptIn: true },
      auditLogs: auditLogs.data,
      withdrawRequested: loadWithdrawRequested(),
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

export async function getMemberAccountSettings(user: { email: string | null } | null): Promise<MemberAccountSettings> {
  const settings = loadMemberAccountSettings()
  if (!settings.profile.email && user?.email) {
    const seeded = {
      ...settings,
      profile: {
        ...settings.profile,
        email: user.email,
      },
    }
    saveMemberAccountSettings(seeded)
    return seeded
  }
  return settings
}

export async function updateMemberAccountSettings(settings: MemberAccountSettings): Promise<MemberAccountSettings> {
  saveMemberAccountSettings(settings)
  return settings
}
