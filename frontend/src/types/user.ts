/**
 * ユーザーロール定義
 * Clerk の user.publicMetadata.role で管理する
 */
export type UserRole = 'guest' | 'member' | 'admin'

/**
 * Clerk の publicMetadata に格納する型
 */
export interface UserPublicMetadata {
  role: UserRole
}

/**
 * アプリ内で使用するユーザー情報
 */
export interface AppUser {
  id: string
  email: string | null
  role: UserRole
}
