/**
 * ユーザーロール定義
 * Clerk の user.publicMetadata.role で管理する
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
 * Clerk の publicMetadata に格納する型
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
