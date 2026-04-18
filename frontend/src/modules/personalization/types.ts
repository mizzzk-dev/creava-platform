export type PersonalizationSourceSite = 'main' | 'store' | 'fc'

export type PersonalizationEntityKind =
  | 'product'
  | 'fanclub'
  | 'news'
  | 'blog'
  | 'event'
  | 'guide'
  | 'faq'

export interface PersonalizationEntityRef {
  kind: PersonalizationEntityKind
  slug: string
  title: string
  href: string
  sourceSite: PersonalizationSourceSite
  locale?: string | null
}

export interface FavoriteItem extends PersonalizationEntityRef {
  id: string
  createdAt: string
  updatedAt: string
  userId?: string | null
}

export interface ViewHistoryItem extends PersonalizationEntityRef {
  id: string
  viewedAt: string
  userId?: string | null
}

export type MemberNotificationType =
  | 'fc_update'
  | 'member_benefit'
  | 'store_new_arrival'
  | 'featured_item'
  | 'event_update'
  | 'announcement'
  | 'system'
  | 'support'
  | 'mypage'

export interface MemberNotificationItem {
  id: string
  type: MemberNotificationType
  priority: 'normal' | 'high'
  sourceSite: PersonalizationSourceSite
  category: string
  title: string
  body: string
  href?: string | null
  isRead: boolean
  createdAt: string
  readAt?: string | null
  userId?: string | null
}
