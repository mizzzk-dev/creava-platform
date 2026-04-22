import { createMockMemberDashboardData } from './mock'
import { loadMemberAccountSettings, loadMemberPreferences, loadWithdrawRequested, saveMemberAccountSettings, saveMemberPreferences, saveWithdrawRequested } from './storage'
import type { MemberAccountSettings, MemberDashboardData, MemberPreferences } from './types'
import { fetchCollection } from '@/lib/api/strapi'
import { isStrapiForbiddenError } from '@/lib/api/fallback'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { StrapiApiError } from '@/lib/api/client'

const USE_MOCK = !import.meta.env.VITE_STRAPI_API_URL
const MEMBER_PAGE_SIZE = 10

type SecurityOverviewResponse = {
  securitySummary: {
    securityTimelineState: string
    securityNoticeState: string
    suspiciousReviewState: string
    recentAccessState: string
    recoveryState: string
  }
  recentEvents: Array<{
    id: number
    securityEventType: string
    eventOccurredAt: string
    securityEventSeverity?: string
    securityEventSource?: string
    result?: string
  }>
  notices: Array<{
    id: number
    title: string
    message: string
    securityNoticeState: 'none' | 'info' | 'review_recommended' | 'action_required' | 'resolved'
    publishedAtISO: string
  }>
}

export type MemberBillingSummary = {
  membership: {
    membershipPlan: 'free' | 'standard' | 'premium'
    membershipStatus: 'non_member' | 'member' | 'grace' | 'expired' | 'canceled' | 'suspended'
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
  securityHub?: string
  securitySummary?: {
    securityLevelState: string
    mfaState: string
    reauthRequiredState: string
    linkedIdentityState: string
    sessionState: string
    recentAccessState: string
    recoveryState: string
    sensitiveActionState: string
    passwordChangeCapability: string
    emailChangeCapability: string
    providerLinkCapability: string
    sessionRevokeCapability: string
    securityNoticeState: string
    securityUpdatedAt: string | null
    lastSensitiveActionAt: string | null
    lastPasswordResetAt: string | null
    lastEmailChangeAt: string | null
    lastMfaUpdateAt: string | null
    linkedProviders: string[]
    recentAccess?: {
      lastLoginAt: string | null
      sourceSite: string
      sessionId: string | null
    }
  } | null
}

export async function getMemberBillingSummary(authToken: string): Promise<MemberBillingSummary> {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL
  if (!baseUrl) {
    return {
      membership: { membershipPlan: 'free', membershipStatus: 'non_member', accessLevel: 'logged_in' },
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
    securityHub: typeof json.securityHub === 'string' ? json.securityHub : undefined,
    securitySummary: json.securitySummary ?? null,
  }
}

export async function verifySensitiveAction(authToken: string, actionType: 'email_change' | 'password_change' | 'provider_link_change' | 'session_revoke' | 'account_recovery'): Promise<{ ok: boolean; verifiedAt: string }> {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL
  if (!baseUrl) throw new Error('VITE_STRAPI_API_URL が未設定です。')

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/user-sync/security/sensitive-action`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ actionType }),
  })

  if (response.status === 412) {
    throw new Error('reauth_required')
  }
  if (!response.ok) {
    throw new Error(`sensitive action verify failed: ${response.status}`)
  }
  const json = await response.json() as { ok: boolean; verifiedAt: string }
  return json
}

export async function appendSecurityEvent(authToken: string, eventType: string, metadata: Record<string, unknown> = {}): Promise<void> {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL
  if (!baseUrl) return
  await fetch(`${baseUrl.replace(/\/$/, '')}/api/user-sync/security/events`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventType,
      sourceSite: import.meta.env.VITE_SITE_TYPE ?? 'main',
      dedupeKey: `${eventType}:${new Date().toISOString().slice(0, 16)}`,
      metadata,
    }),
  })
}

async function getSecurityOverview(authToken: string): Promise<SecurityOverviewResponse | null> {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL
  if (!baseUrl) return null
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/user-sync/security/overview`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  })
  if (!response.ok) return null
  return response.json() as Promise<SecurityOverviewResponse>
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
    const [orderData, notices, auditLogs, securityOverview] = await Promise.all([
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
      authToken ? getSecurityOverview(authToken) : Promise.resolve(null),
    ])

    const saved = loadMemberPreferences()
    return {
      orders: orderData.orders,
      shipments: orderData.shipments,
      notices: securityOverview
        ? securityOverview.notices.map((notice) => ({
          id: notice.id,
          title: notice.title,
          body: notice.message,
          audience: 'all' as const,
          priority: notice.securityNoticeState === 'action_required' ? 'high' as const : 'normal' as const,
          publishedAt: notice.publishedAtISO,
        }))
        : notices.data,
      preferences: saved ?? { newsletterOptIn: true, loginAlertOptIn: true },
      auditLogs: securityOverview
        ? securityOverview.recentEvents.map((event) => ({
          id: event.id,
          eventType: event.securityEventType,
          createdAt: event.eventOccurredAt,
          severity: event.securityEventSeverity,
          sourceSite: event.securityEventSource,
          result: event.result,
        }))
        : auditLogs.data,
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

export type PrivacySummary = {
  consentState: string
  notificationConsentState: 'enabled' | 'disabled' | 'partial'
  crmConsentState: 'opted_in' | 'opted_out' | 'restricted'
  analyticsConsentState: 'unknown' | 'accepted' | 'declined' | 'limited'
  dataExportState: string
  dataExportRequestState: string
  dataExportRequestedAt: string | null
  dataExportReadyAt: string | null
  deletionState: string
  deletionRequestState: string
  deletionRequestedAt: string | null
  deletionConfirmedAt: string | null
  retentionState: string
  retentionReason: string | null
  membershipCancellationState: string
  legalHoldState: string
  privacyUpdatedAt: string | null
  userFacingNotes?: {
    deletion?: string
    retention?: string
    export?: string
  }
}

async function fetchPrivacyWithAuth<T>(path: string, authToken: string, init?: RequestInit): Promise<T> {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL
  if (!baseUrl) throw new Error('VITE_STRAPI_API_URL が未設定です。')
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    throw new Error(`privacy API error: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export async function getPrivacySummary(authToken: string): Promise<PrivacySummary> {
  const json = await fetchPrivacyWithAuth<{ privacySummary: PrivacySummary }>('/api/user-sync/privacy/summary', authToken)
  return json.privacySummary
}

export async function updatePrivacyPreferences(
  authToken: string,
  payload: Pick<PrivacySummary, 'notificationConsentState' | 'crmConsentState' | 'analyticsConsentState'>,
): Promise<PrivacySummary> {
  const json = await fetchPrivacyWithAuth<{ privacySummary: PrivacySummary }>('/api/user-sync/privacy/preferences', authToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return json.privacySummary
}

export async function requestPrivacyDataExport(authToken: string): Promise<PrivacySummary> {
  const json = await fetchPrivacyWithAuth<{ privacySummary: PrivacySummary }>('/api/user-sync/privacy/export-request', authToken, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  return json.privacySummary
}

export async function requestPrivacyDeletion(authToken: string, confirmPhrase: string): Promise<PrivacySummary> {
  const json = await fetchPrivacyWithAuth<{ privacySummary: PrivacySummary }>('/api/user-sync/privacy/deletion-request', authToken, {
    method: 'POST',
    body: JSON.stringify({ confirmPhrase }),
  })
  return json.privacySummary
}

export async function requestMembershipCancellationFlow(authToken: string): Promise<PrivacySummary> {
  const json = await fetchPrivacyWithAuth<{ privacySummary: PrivacySummary }>('/api/user-sync/privacy/membership-cancellation', authToken, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  return json.privacySummary
}
