import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useCurrentUser } from '@/hooks'
import { ROUTES } from '@/lib/routeConstants'

interface Props {
  children: ReactNode
}

export default function FanclubAuthGuard({ children }: Props) {
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

  return <>{children}</>
}
