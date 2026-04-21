import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/hooks'
import { useAuthClient } from '@/lib/auth/AuthProvider'
import { HAS_AUTH } from '@/lib/auth/config'

/**
 * ログイン / ログアウトボタン（統一認証）
 *
 * - 未ロード時: 非表示（レイアウトシフト防止）
 * - 未ログイン: ログインボタン
 * - ログイン済み: role バッジ + ログアウトボタン
 */
function AuthButtonWithAuth() {
  const { isLoaded, signIn, signOut } = useAuthClient()
  const { user, isSignedIn } = useCurrentUser()
  const { t } = useTranslation()

  if (!isLoaded) return null

  const btnClass = 'text-sm text-gray-500 hover:text-gray-900 transition-colors'

  if (!isSignedIn) {
    return (
      <button onClick={() => void signIn()} className={btnClass}>
        {t('auth.signIn')}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {user && (
        <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">
          {user.membershipStatus}
        </span>
      )}
      <button onClick={() => void signOut()} className={btnClass}>
        {t('auth.signOut')}
      </button>
    </div>
  )
}

/**
 * 認証設定未完了時は認証ボタンを非表示にする
 */
export default HAS_AUTH
  ? AuthButtonWithAuth
  : function AuthButtonDisabled() { return null }
