/**
 * ユーザーロール定義
 * 認証プロバイダのクレームで管理する
 */
export type UserRole = 'guest' | 'free' | 'member' | 'premium' | 'admin'

export type MemberPlan = 'free' | 'paid' | 'premium'

export type ContractStatus =
  | 'active'
  | 'grace'
  | 'cancel_scheduled'
  | 'canceled'
  | 'expired'

/**
 * 認証クレームの拡張項目
 */
export interface UserPublicMetadata {
  role: UserRole
  memberPlan?: MemberPlan
  contractStatus?: ContractStatus
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
  emailVerified: boolean
}
