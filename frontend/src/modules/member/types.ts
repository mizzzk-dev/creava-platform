export type MemberOrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refund_in_progress' | 'refunded' | 'exception'
export type ShipmentStatus = 'not_shipped' | 'preparing' | 'in_transit' | 'delivered' | 'returned' | 'exception'
export type NoticeAudience = 'all' | 'member'
export type NoticePriority = 'high' | 'normal'

export interface MemberOrderLine {
  productName: string
  quantity: number
}

export interface MemberOrder {
  id: number
  externalOrderId: string
  provider: string
  providerStatus: string
  status: MemberOrderStatus
  total: number
  currency: string
  orderedAt: string
  lines: MemberOrderLine[]
}

export interface MemberShipment {
  id: number
  orderExternalId: string
  carrier: string
  trackingNumber: string
  status: ShipmentStatus
  estimatedDeliveryAt: string | null
  lastSyncedAt: string
}

export interface MemberNotice {
  id: number
  title: string
  body: string
  audience: NoticeAudience
  priority: NoticePriority
  publishedAt: string
}

export interface MemberPreferences {
  newsletterOptIn: boolean
  loginAlertOptIn: boolean
}

export type MembershipStatus = 'guest' | 'active' | 'grace_period' | 'paused' | 'cancelled'
export type MembershipPlan = 'free' | 'standard' | 'premium'
export type LoyaltyBadge = 'welcome' | 'steady' | 'insider' | 'backstage'
export type RewardState = 'locked' | 'available' | 'claimed'
export type LoyaltyAccessLevel = 'public' | 'logged_in' | 'member' | 'premium'

export interface MemberBenefitItem {
  id: string
  title: string
  description: string
  accessLevel: LoyaltyAccessLevel
}

export interface LoyaltyProfile {
  membershipStatus: MembershipStatus
  membershipPlan: MembershipPlan
  membershipStartedAt: string | null
  renewalDate: string | null
  tenureMonths: number
  loyaltyBadge: LoyaltyBadge
  rewardState: RewardState
  accessLevel: LoyaltyAccessLevel
  memberBenefits: MemberBenefitItem[]
  campaignEligibility: string[]
  earlyAccessEligible: boolean
  limitedContentEligible: boolean
  favoriteCategory: string | null
  engagementHint: string
  retentionSegment: string
  displayPriority: number
}

export interface AuditLog {
  id: number
  eventType: string
  createdAt: string
  severity?: string
  sourceSite?: string
  result?: string
}

export interface MemberDashboardData {
  orders: MemberOrder[]
  shipments: MemberShipment[]
  notices: MemberNotice[]
  preferences: MemberPreferences
  auditLogs: AuditLog[]
  withdrawRequested: boolean
  loyaltyProfile: LoyaltyProfile
}

export interface MemberProfileSettings {
  userId: string
  displayName: string
  email: string
}

export interface MemberPaymentSettings {
  id: string
  label: string
  cardholderName: string
  cardNumber: string
  expiryMonth: string
  expiryYear: string
}

export interface MemberShippingSettings {
  id: string
  label: string
  postalCode: string
  prefecture: string
  city: string
  addressLine: string
  building: string
}

export interface MemberAccountSettings {
  profile: MemberProfileSettings
  payments: MemberPaymentSettings[]
  shippings: MemberShippingSettings[]
}
