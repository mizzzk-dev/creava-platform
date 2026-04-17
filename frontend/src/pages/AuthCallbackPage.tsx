import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HAS_LOGTO } from '@/lib/auth/config'
import { isFanclubSite } from '@/lib/siteLinks'
import { useAuthClient } from '@/lib/auth/AuthProvider'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { handleCallback } = useAuthClient()

  useEffect(() => {
    if (!HAS_LOGTO) {
      navigate('/', { replace: true })
      return
    }

    void handleCallback()
      .then(() => {
        navigate('/', { replace: true })
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
