import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useClerk } from '@clerk/clerk-react'
import { useCurrentUser } from '@/hooks'
import RestrictedNotice from '@/components/common/RestrictedNotice'

interface Props {
  children: ReactNode
}

/**
 * Fanclub ページ専用のアクセスガード
 *
 * 判定フロー:
 * 1. isLoaded = false → ローディング表示（Clerk 認証状態の解決待ち）
 * 2. isSignedIn = false → ログイン誘導
 * 3. role = 'guest' → 会員限定コンテンツの案内（ログイン済みだが非会員）
 * 4. role = 'member' | 'admin' → children を描画
 */
export default function FanclubGuard({ children }: Props) {
  const { t } = useTranslation()
  const { openSignIn } = useClerk()
  const { user, isLoaded, isSignedIn } = useCurrentUser()

  if (!isLoaded) {
    return <p className="text-sm text-gray-400">{t('common.loading')}</p>
  }

  if (!isSignedIn) {
    return (
      <RestrictedNotice
        variant="not_signed_in"
        onSignIn={() => void openSignIn({})}
      />
    )
  }

  if (user?.role === 'guest') {
    return <RestrictedNotice variant="not_member" />
  }

  return <>{children}</>
}
