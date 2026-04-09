export type NotificationChannel = 'email' | 'push' | 'in_app'

export type NotificationTopic =
  | 'restock'
  | 'sale_start'
  | 'campaign'
  | 'member_early_access'
  | 'weekly_update'
  | 'new_content'

export interface NotificationSubscription {
  id: string
  topic: NotificationTopic
  channel: NotificationChannel
  site: 'store' | 'fanclub' | 'cross'
  targetType: 'product' | 'campaign' | 'content' | 'digest'
  targetId: string
  title: string
  description?: string
  status: 'active' | 'paused'
  createdAt: string
  updatedAt: string
}

export interface NotificationPreference {
  weeklyDigest: boolean
  memberOnlyUpdates: boolean
  storeRestock: boolean
  campaignReminder: boolean
}

export const DEFAULT_NOTIFICATION_PREFERENCE: NotificationPreference = {
  weeklyDigest: true,
  memberOnlyUpdates: true,
  storeRestock: true,
  campaignReminder: true,
}
