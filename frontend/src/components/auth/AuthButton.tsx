import { useAuth, useClerk } from '@clerk/clerk-react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/hooks'

/**
 * ログイン / ログアウトボタン
 *
 * - 未ロード時: 非表示（レイアウトシフト防止）
 * - 未ログイン: ログインボタン（Clerk モーダルを開く）
 * - ログイン済み: role バッジ + ログアウトボタン
 */
export default function AuthButton() {
  const { isLoaded } = useAuth()
  const { openSignIn, signOut } = useClerk()
  const { user, isSignedIn } = useCurrentUser()
  const { t } = useTranslation()

  if (!isLoaded) return null

  const btnClass =
    'text-sm text-gray-500 hover:text-gray-900 transition-colors'

  if (!isSignedIn) {
    return (
      <button
        onClick={() => void openSignIn({})}
        className={btnClass}
      >
        {t('auth.signIn')}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {user && (
        <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">
          {user.role}
        </span>
      )}
      <button
        onClick={() => void signOut()}
        className={btnClass}
      >
        {t('auth.signOut')}
      </button>
    </div>
  )
}
