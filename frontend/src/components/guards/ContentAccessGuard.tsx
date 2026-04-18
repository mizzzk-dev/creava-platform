import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser, useContentAccess } from '@/hooks'
import { useAuthClient } from '@/lib/auth/AuthProvider'
import { HAS_LOGTO } from '@/lib/auth/config'
import RestrictedNotice from '@/components/common/RestrictedNotice'
import type { ContentBase } from '@/types'

interface Props {
  item: Pick<ContentBase, 'accessStatus' | 'limitedEndAt' | 'archiveVisibleForFC'>
  children: ReactNode
}

/**
 * コンテンツ詳細ページ用のアクセスガード（Logto）
 */
function ContentAccessGuardWithAuth({ item, children }: Props) {
  const { t } = useTranslation()
  const { signIn } = useAuthClient()
  const { isLoaded, isSignedIn } = useCurrentUser()
  const { canView } = useContentAccess()

  if (!isLoaded) {
    return <p className="text-sm text-gray-400">{t('common.loading')}</p>
  }

  if (!canView(item)) {
    if (!isSignedIn) {
      return (
        <RestrictedNotice
          variant="not_signed_in"
          onSignIn={() => void signIn()}
        />
      )
    }
    return <RestrictedNotice variant="not_member" />
  }

  return <>{children}</>
}

/**
 * Logto 未設定時: public コンテンツのみ表示、それ以外はゲスト扱いで制限
 */
function ContentAccessGuardNoAuth({ item, children }: Props) {
  const { canView } = useContentAccess()

  if (!canView(item)) {
    return <RestrictedNotice variant="not_signed_in" onSignIn={() => {}} />
  }

  return <>{children}</>
}

export default HAS_LOGTO
  ? ContentAccessGuardWithAuth
  : ContentAccessGuardNoAuth
