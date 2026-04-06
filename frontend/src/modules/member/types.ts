export type MemberOrderStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type ShipmentStatus = 'label_created' | 'in_transit' | 'out_for_delivery' | 'delivered'
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

export interface AuditLog {
  id: number
  eventType: string
  createdAt: string
}

export interface MemberDashboardData {
  orders: MemberOrder[]
  shipments: MemberShipment[]
  notices: MemberNotice[]
  preferences: MemberPreferences
  auditLogs: AuditLog[]
  withdrawRequested: boolean
}

export interface MemberProfileSettings {
  displayName: string
  email: string
}

export interface MemberPaymentSettings {
  id: string
  label: string
  summary: string
}

export interface MemberShippingSettings {
  id: string
  label: string
  summary: string
}

export interface MemberAccountSettings {
  profile: MemberProfileSettings
  payments: MemberPaymentSettings[]
  shippings: MemberShippingSettings[]
}
