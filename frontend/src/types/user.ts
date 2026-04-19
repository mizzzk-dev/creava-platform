/**
 * ユーザーロール定義
 * 認証プロバイダのクレームで管理する
 */
export type UserRole = 'guest' | 'free' | 'member' | 'premium' | 'admin'

export type MemberPlan = 'free' | 'paid' | 'premium'

export type MembershipStatus = 'non_member' | 'member' | 'grace' | 'canceled' | 'expired' | 'suspended'

export type AccountStatus = 'active' | 'pending' | 'restricted' | 'suspended' | 'deleted_like'

export type InternalRole = 'user' | 'support' | 'moderator' | 'admin' | 'super_admin'

export type ContractStatus =
  | 'active'
  | 'grace'
  | 'cancel_scheduled'
  | 'canceled'
  | 'expired'

export type SubscriptionState = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'

export type BillingState = 'clear' | 'pending' | 'failed' | 'refunded' | 'disputed'

export type EntitlementState = 'inactive' | 'active' | 'limited' | 'grace' | 'blocked'

/**
 * 認証クレームの拡張項目
 */
export interface UserPublicMetadata {
  role: UserRole
  memberPlan?: MemberPlan
  contractStatus?: ContractStatus
  subscriptionState?: SubscriptionState
  billingState?: BillingState
  entitlementState?: EntitlementState
  membershipStatus?: MembershipStatus
  accountStatus?: AccountStatus
  internalRole?: InternalRole
  accessLevel?: 'public' | 'logged_in' | 'member' | 'premium' | 'admin'
  emailVerified?: boolean
}

/**
 * アプリ内で使用するユーザー情報
 */
export interface AppUser {
  id: string
  email: string | null
  role: UserRole
  memberPlan: MemberPlan
  contractStatus: ContractStatus
  subscriptionState: SubscriptionState
  billingState: BillingState
  entitlementState: EntitlementState
  membershipStatus: MembershipStatus
  accountStatus: AccountStatus
  internalRole: InternalRole
  accessLevel: 'public' | 'logged_in' | 'member' | 'premium' | 'admin'
  emailVerified: boolean
}
