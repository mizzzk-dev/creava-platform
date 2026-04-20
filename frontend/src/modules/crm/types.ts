export type UserState = 'guest' | 'logged_in'
export type MembershipStatus = 'non_member' | 'member' | 'grace' | 'canceled' | 'expired' | 'suspended'
export type MembershipPlan = 'free' | 'standard' | 'premium'
export type SourceSite = 'main' | 'store' | 'fc'
export type DeliveryChannel = 'in_app' | 'email'
export type RenewalState = 'not_applicable' | 'upcoming' | 'due' | 'grace' | 'completed' | 'failed' | 'expired' | 'reactivated'

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
  renewalState?: RenewalState
  lifecycleMessageState?: 'idle' | 'renewal_pending' | 'grace_notice_sent' | 'winback_sent' | 'suppressed'
  supportIntentSegment?: 'none' | 'high'
  dormantUserSegment?: 'none' | '14d' | '30d' | '60d'
  benefitVisibilityState?: 'hidden' | 'teaser' | 'visible' | 'emphasized' | 'member_only'
  accessGateState?: 'public' | 'logged_in_only' | 'member_only' | 'entitled_only' | 'temporarily_blocked'
  earlyAccessState?: 'none' | 'preview' | 'early_access' | 'public_release'
  personalizationState?: 'none' | 'basic' | 'member' | 'cross_site'
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
