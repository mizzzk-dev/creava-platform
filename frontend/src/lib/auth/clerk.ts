import type { AppUser, UserRole } from '@/types'

/**
 * toAppUser が使用する Clerk ユーザーの最小インターフェース
 *
 * @clerk/clerk-react の内部型に直接依存せず、
 * useUser() が返すオブジェクトの使用フィールドのみを定義する
 */
interface ClerkUserLike {
  id: string
  primaryEmailAddress:
    | {
        emailAddress: string
        verification?: {
          status?: 'verified' | 'unverified' | 'transferable' | string | null
        }
      }
    | null
    | undefined
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
  if (raw === 'premium') return 'premium'
  if (raw === 'member') return 'member'
  if (raw === 'free') return 'free'
  return 'guest'
}

/**
 * Clerk のユーザーオブジェクトをアプリ内の AppUser に変換する
 *
 * Clerk の型への依存はこの関数にのみ閉じ込める。
 * 各ページ・フックは AppUser だけを参照すること。
 */
export function toAppUser(clerkUser: ClerkUserLike): AppUser {
  const role = resolveRole(clerkUser.publicMetadata.role)
  const rawPlan = clerkUser.publicMetadata.memberPlan
  const rawStatus = clerkUser.publicMetadata.contractStatus
  const verificationStatus = clerkUser.primaryEmailAddress?.verification?.status

  return {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
    role,
    memberPlan: rawPlan === 'premium' ? 'premium' : rawPlan === 'free' ? 'free' : 'paid',
    contractStatus:
      rawStatus === 'grace' ||
      rawStatus === 'cancel_scheduled' ||
      rawStatus === 'canceled' ||
      rawStatus === 'expired'
        ? rawStatus
        : 'active',
    emailVerified: verificationStatus === 'verified',
  }
}
