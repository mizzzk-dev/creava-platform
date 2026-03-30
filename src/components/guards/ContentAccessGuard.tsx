import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useClerk } from '@clerk/clerk-react'
import { useCurrentUser, useContentAccess } from '@/hooks'
import RestrictedNotice from '@/components/common/RestrictedNotice'
import type { ContentBase } from '@/types'

interface Props {
  /** アクセス判定に使用するコンテンツのメタ情報 */
  item: Pick<ContentBase, 'status' | 'limitedEndAt' | 'archiveVisibleForFC'>
  children: ReactNode
}

/**
 * コンテンツ詳細ページ用のアクセスガード（News / Blog / Works 共通）
 *
 * 判定フロー:
 * 1. Clerk isLoaded = false → ローディング（認証状態の解決待ち）
 * 2. canView(item) = false + 未ログイン → ログイン誘導
 * 3. canView(item) = false + ログイン済み → 会員限定案内
 * 4. canView(item) = true → children を描画
 *
 * Fanclub ページには FanclubGuard を使うこと。
 */
export default function ContentAccessGuard({ item, children }: Props) {
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
