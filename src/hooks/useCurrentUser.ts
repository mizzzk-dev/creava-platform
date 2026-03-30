import { useUser } from '@clerk/clerk-react'
import { toAppUser } from '@/lib/auth/clerk'
import type { AppUser } from '@/types'

export interface UseCurrentUserResult {
  /** 正規化済みのユーザー情報。未ログイン / 読み込み中は null */
  user: AppUser | null
  /** Clerk の認証状態の読み込みが完了しているか */
  isLoaded: boolean
  /** ログイン済みか */
  isSignedIn: boolean
}

/**
 * 現在のログインユーザーを AppUser として返すフック
 *
 * Clerk への依存はこのフックに封じ込める。
 * 各ページ・コンポーネントはこのフックだけを使用すること。
 *
 * - 未ログイン時: { user: null, isLoaded: true,  isSignedIn: false }
 * - 読み込み中:   { user: null, isLoaded: false, isSignedIn: false }
 * - ログイン済み: { user: AppUser, isLoaded: true, isSignedIn: true }
 */
export function useCurrentUser(): UseCurrentUserResult {
  const { user, isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return { user: null, isLoaded: false, isSignedIn: false }
  }

  if (!isSignedIn || !user) {
    return { user: null, isLoaded: true, isSignedIn: false }
  }

  return {
    user: toAppUser(user),
    isLoaded: true,
    isSignedIn: true,
  }
}
