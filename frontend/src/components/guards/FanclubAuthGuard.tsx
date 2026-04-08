import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useCurrentUser } from '@/hooks'
import { ROUTES } from '@/lib/routeConstants'
import { canAccessByRole, isMembershipActive, type VisibilityScope } from '@/lib/auth/membership'

interface Props {
  children: ReactNode
  requiredVisibility?: Exclude<VisibilityScope, 'public'>
}

const DEFAULT_REQUIRED_VISIBILITY: Exclude<VisibilityScope, 'public'> = 'members'

export default function FanclubAuthGuard({ children, requiredVisibility = DEFAULT_REQUIRED_VISIBILITY }: Props) {
  const { isLoaded, isSignedIn, user } = useCurrentUser()
  const location = useLocation()

  if (!isLoaded) {
    return <p className="mx-auto max-w-5xl px-4 py-14 text-sm text-gray-500">認証状態を確認しています...</p>
  }

  if (!isSignedIn || !user) {
    const redirectTo = `${location.pathname}${location.search}`
    return <Navigate to={`${ROUTES.FC_LOGIN}?redirect=${encodeURIComponent(redirectTo)}`} replace />
  }

  if (!user.emailVerified) {
    return (
      <section className="mx-auto max-w-xl px-4 py-14">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">メール認証が必要です</h1>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">セキュリティ保護のため、メール認証完了後に会員ページへアクセスできます。</p>
        <Link to={ROUTES.FC_LOGIN_VERIFY_EMAIL} className="mt-5 inline-flex text-sm font-medium text-violet-600 hover:text-violet-500">メール認証ページへ →</Link>
      </section>
    )
  }

  if (!isMembershipActive(user.contractStatus) || !canAccessByRole(user.role, requiredVisibility)) {
    return (
      <section className="mx-auto max-w-xl px-4 py-14">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">会員プランの確認が必要です</h1>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">このページは {requiredVisibility === 'premium' ? 'プレミアム会員' : '有効な会員'} のみ閲覧できます。契約状態をご確認ください。</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to={ROUTES.FC_MYPAGE} className="inline-flex rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-500 dark:border-gray-700 dark:text-gray-200">マイページを確認</Link>
          <Link to={ROUTES.FC_JOIN} className="inline-flex rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900">入会 / プラン更新</Link>
        </div>
      </section>
    )
  }

  return <>{children}</>
}
