import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/hooks'
import { useAuthClient } from '@/lib/auth/AuthProvider'
import { HAS_LOGTO } from '@/lib/auth/config'
import RestrictedNotice from '@/components/common/RestrictedNotice'

interface Props {
  children: ReactNode
}

/**
 * Fanclub ページ専用のアクセスガード（Logto）
 *
 * 判定フロー:
 * 1. isLoaded = false → ローディング表示（認証状態の解決待ち）
 * 2. isSignedIn = false → ログイン誘導
 * 3. role = 'guest' → 会員限定コンテンツの案内
 * 4. role = 'member' | 'admin' → children を描画
 */
function FanclubGuardWithAuth({ children }: Props) {
  const { t } = useTranslation()
  const { signIn } = useAuthClient()
  const { user, isLoaded, isSignedIn } = useCurrentUser()

  if (!isLoaded) {
    return <p className="text-sm text-gray-400">{t('common.loading')}</p>
  }

  if (!isSignedIn) {
    return (
        <RestrictedNotice
          variant="not_signed_in"
          onSignIn={() => void signIn()}
        />
    )
  }

  if (user?.role === 'guest') {
    return <RestrictedNotice variant="not_member" />
  }

  return <>{children}</>
}

/**
 * Logto 未設定時はファンクラブコンテンツをゲスト扱いで非表示にする
 */
function FanclubGuardNoAuth() {
  return <RestrictedNotice variant="not_signed_in" onSignIn={() => {}} />
}

export default HAS_LOGTO
  ? FanclubGuardWithAuth
  : FanclubGuardNoAuth
