export type UserState = 'guest' | 'logged_in'
export type MembershipStatus = 'non_member' | 'member' | 'premium' | 'paused' | 'cancelled'
export type MembershipPlan = 'free' | 'standard' | 'premium'
export type SourceSite = 'main' | 'store' | 'fc'
export type DeliveryChannel = 'in_app' | 'email'

export type NotificationTheme =
  | 'fc_update'
  | 'member_benefit'
  | 'store_new_arrival'
  | 'favorite_related'
  | 'campaign'
  | 'event'
  | 'support_important'

export interface SegmentContext {
  userState: UserState
  membershipStatus: MembershipStatus
  membershipPlan: MembershipPlan
  sourceSite: SourceSite
  locale: string
  favoriteCategories: string[]
  recentViewedTypes: string[]
  notificationPreference: NotificationPreferenceState
  emailOptIn: boolean
  inAppOptIn: boolean
  campaignEligibility: string[]
  earlyAccessEligible: boolean
  loyaltyState: 'cold' | 'active' | 'loyal' | 'dormant'
  engagementSegment: 'new' | 'active' | 'at_risk' | 'dormant'
  supportIntentSegment?: 'none' | 'high'
  dormantUserSegment?: 'none' | '14d' | '30d' | '60d'
}

export interface ThemePreference {
  inApp: boolean
  email: boolean
  required: boolean
}

export interface NotificationPreferenceState {
  allInAppEnabled: boolean
  allEmailEnabled: boolean
  themes: Record<NotificationTheme, ThemePreference>
  updatedAt: string
  locale: string
}

export interface LifecycleScenario {
  key: string
  label: string
  channel: DeliveryChannel
  minIntervalHours: number
  dedupeKey: string
}
