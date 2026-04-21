import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HAS_AUTH } from '@/lib/auth/config'
import { isFanclubSite } from '@/lib/siteLinks'
import { useAuthClient } from '@/lib/auth/AuthProvider'
import { trackMizzzEvent } from '@/modules/analytics/tracking'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { handleCallback } = useAuthClient()

  useEffect(() => {
    if (!HAS_AUTH) {
      navigate('/', { replace: true })
      return
    }

    void handleCallback()
      .then((redirectPath) => {
        const firstLoginDetected = window.sessionStorage.getItem('creava.user-lifecycle.first-login') === 'true'
        const onboardingState = window.sessionStorage.getItem('creava.user-lifecycle.onboarding-state')
        if (firstLoginDetected) {
          trackMizzzEvent('onboarding_start', { sourceSite: 'cross', onboardingStatus: onboardingState ?? 'not_started' })
          window.sessionStorage.removeItem('creava.user-lifecycle.first-login')
        }
        const nextPath = firstLoginDetected && (redirectPath === '/' || redirectPath === '') ? '/member' : redirectPath
        navigate(nextPath, { replace: true })
      })
      .catch(() => {
        navigate(isFanclubSite ? '/login' : '/member', { replace: true })
      })
  }, [handleCallback, navigate])

  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <p className="text-sm text-gray-500 dark:text-gray-300">ログイン処理を完了しています...</p>
    </section>
  )
}
