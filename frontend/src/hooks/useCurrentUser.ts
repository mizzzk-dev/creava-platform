import { useAuthClient } from '@/lib/auth/AuthProvider'
import { toAppUserFromLogtoClaims } from '@/lib/auth/logto'
import type { AppUser } from '@/types'

export interface UseCurrentUserResult {
  /** 正規化済みのユーザー情報。未ログイン / 読み込み中は null */
  user: AppUser | null
  /** 認証状態の読み込みが完了しているか */
  isLoaded: boolean
  /** ログイン済みか */
  isSignedIn: boolean
}

const GUEST: UseCurrentUserResult = { user: null, isLoaded: true, isSignedIn: false }

/**
 * Logto 有効時は claims から AppUser を解決する。
 * Logto 無効時は常にゲスト状態を返す。
 */
export function useCurrentUser(): UseCurrentUserResult {
  const auth = useAuthClient()

  if (!auth.isEnabled) return GUEST
  if (!auth.isLoaded) return { user: null, isLoaded: false, isSignedIn: false }
  if (!auth.isSignedIn || !auth.claims) return GUEST

  const user: AppUser = toAppUserFromLogtoClaims(auth.claims)
  return { user, isLoaded: true, isSignedIn: true }
}
