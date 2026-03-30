import type { AppUser, UserRole } from '@/types'

/**
 * toAppUser が使用する Clerk ユーザーの最小インターフェース
 *
 * @clerk/clerk-react の内部型に直接依存せず、
 * useUser() が返すオブジェクトの使用フィールドのみを定義する
 */
interface ClerkUserLike {
  id: string
  primaryEmailAddress: { emailAddress: string } | null | undefined
  publicMetadata: Record<string, unknown>
}

/**
 * Clerk の publicMetadata.role を UserRole に正規化する
 *
 * 変換ルール:
 * - 'admin'  → admin
 * - 'member' → member
 * - その他 / 未設定 / 未ログイン → guest（安全側フォールバック）
 */
export function resolveRole(raw: unknown): UserRole {
  if (raw === 'admin') return 'admin'
  if (raw === 'member') return 'member'
  return 'guest'
}

/**
 * Clerk のユーザーオブジェクトをアプリ内の AppUser に変換する
 *
 * Clerk の型への依存はこの関数にのみ閉じ込める。
 * 各ページ・フックは AppUser だけを参照すること。
 */
export function toAppUser(clerkUser: ClerkUserLike): AppUser {
  return {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
    role: resolveRole(clerkUser.publicMetadata.role),
  }
}
