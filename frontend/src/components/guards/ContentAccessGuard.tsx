import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useClerk } from '@clerk/clerk-react'
import { useCurrentUser, useContentAccess } from '@/hooks'
import RestrictedNotice from '@/components/common/RestrictedNotice'
import type { ContentBase } from '@/types'

interface Props {
  item: Pick<ContentBase, 'status' | 'limitedEndAt' | 'archiveVisibleForFC'>
  children: ReactNode
}

/**
 * コンテンツ詳細ページ用のアクセスガード（Clerk あり）
 */
function ContentAccessGuardWithClerk({ item, children }: Props) {
  const { t } = useTranslation()
  const { openSignIn } = useClerk()
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
          onSignIn={() => void openSignIn({})}
        />
      )
    }
    return <RestrictedNotice variant="not_member" />
  }

  return <>{children}</>
}

/**
 * Clerk 未設定時: public コンテンツのみ表示、それ以外はゲスト扱いで制限
 */
function ContentAccessGuardNoClerk({ item, children }: Props) {
  const { canView } = useContentAccess()

  if (!canView(item)) {
    return <RestrictedNotice variant="not_signed_in" onSignIn={() => {}} />
  }

  return <>{children}</>
}

export default import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  ? ContentAccessGuardWithClerk
  : ContentAccessGuardNoClerk
