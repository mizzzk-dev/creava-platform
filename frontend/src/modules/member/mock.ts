import type { AuditLog, MemberDashboardData, MemberPreferences } from './types'

const BASE_PREFERENCES: MemberPreferences = {
  newsletterOptIn: true,
  loginAlertOptIn: true,
}

const BASE_LOGS: AuditLog[] = [
  { id: 1, eventType: 'login.success', createdAt: '2026-04-05T10:15:00.000Z' },
  { id: 2, eventType: 'preferences.newsletter.updated', createdAt: '2026-04-03T03:21:00.000Z' },
  { id: 3, eventType: 'order.viewed', createdAt: '2026-03-30T12:03:00.000Z' },
]

export function createMockMemberDashboardData(isMember: boolean): MemberDashboardData {
  return {
    orders: [
      {
        id: 101,
        externalOrderId: 'CV-2026-00031',
        provider: 'stripe',
        providerStatus: 'paid',
        status: 'shipped',
        total: 12800,
        currency: 'JPY',
        orderedAt: '2026-03-29T09:30:00.000Z',
        lines: [
          { productName: isMember ? 'FC限定フォトブック Vol.2' : 'Photo Book Vol.2', quantity: 1 },
          { productName: 'Sticker Set Spring', quantity: 1 },
        ],
      },
      {
        id: 102,
        externalOrderId: 'CV-2026-00019',
        provider: 'stripe',
        providerStatus: 'paid',
        status: 'delivered',
        total: 4800,
        currency: 'JPY',
        orderedAt: '2026-03-12T14:05:00.000Z',
        lines: [{ productName: 'Digital Wall Paper Pack', quantity: 1 }],
      },
    ],
    shipments: [
      {
        id: 7001,
        orderExternalId: 'CV-2026-00031',
        carrier: 'Yamato',
        trackingNumber: '1234-5678-9012',
        status: 'in_transit',
        estimatedDeliveryAt: '2026-04-08T00:00:00.000Z',
        lastSyncedAt: '2026-04-06T07:10:00.000Z',
      },
      {
        id: 7000,
        orderExternalId: 'CV-2026-00019',
        carrier: 'Sagawa',
        trackingNumber: '9988-7766-5544',
        status: 'delivered',
        estimatedDeliveryAt: null,
        lastSyncedAt: '2026-03-16T10:00:00.000Z',
      },
    ],
    notices: [
      {
        id: 900,
        title: 'GW期間の配送スケジュール',
        body: '4月29日〜5月6日は発送処理に通常より1〜2営業日お時間をいただきます。',
        audience: 'all',
        priority: 'high',
        publishedAt: '2026-04-05T00:00:00.000Z',
      },
      {
        id: 901,
        title: '会員限定：先行販売開始のお知らせ',
        body: 'FC会員向けに4月10日 20:00から先行販売を開始します。',
        audience: 'member',
        priority: 'normal',
        publishedAt: '2026-04-02T00:00:00.000Z',
      },
    ],
    preferences: BASE_PREFERENCES,
    auditLogs: BASE_LOGS,
    withdrawRequested: false,
    loyaltyProfile: {
      membershipStatus: isMember ? 'active' : 'guest',
      membershipPlan: isMember ? 'standard' : 'free',
      membershipStartedAt: isMember ? '2025-08-01T00:00:00.000Z' : null,
      renewalDate: isMember ? '2026-05-01T00:00:00.000Z' : null,
      tenureMonths: isMember ? 8 : 0,
      loyaltyBadge: isMember ? 'steady' : 'welcome',
      rewardState: isMember ? 'available' : 'locked',
      accessLevel: isMember ? 'member' : 'public',
      memberBenefits: [
        {
          id: 'benefit-early-gallery',
          title: 'ギャラリー先行公開',
          description: '毎月の先行公開コンテンツに24時間早くアクセスできます。',
          accessLevel: 'member',
        },
        {
          id: 'benefit-store-drop',
          title: 'Store 先行案内',
          description: 'FC会員向けに新作ドロップを先行案内します。',
          accessLevel: 'member',
        },
      ],
      campaignEligibility: isMember ? ['member-weekly', 'fc-store-bridge'] : ['public-welcome'],
      earlyAccessEligible: isMember,
      limitedContentEligible: isMember,
      favoriteCategory: isMember ? 'gallery' : null,
      engagementHint: isMember
        ? '今週の先行公開と会員限定キャンペーンをチェックしてください。'
        : 'ログイン後に会員特典を確認すると、次回公開の通知を受け取れます。',
      retentionSegment: isMember ? 'active_monthly' : 'guest_explore',
      displayPriority: isMember ? 80 : 20,
    },
  }
}
