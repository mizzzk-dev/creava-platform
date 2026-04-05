import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/routeConstants'
import {
  loadCookieConsent,
  saveCookieConsent,
  setAnalyticsEnabled,
  type AnalyticsConsent,
} from '@/modules/cookie/consent'

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const state = loadCookieConsent()
    if (!state) {
      setVisible(true)
      setAnalyticsEnabled(false)
      return
    }
    setAnalyticsEnabled(state.analytics === 'granted')
  }, [])

  if (!visible) return null

  function decide(analytics: AnalyticsConsent) {
    saveCookieConsent({
      necessary: true,
      analytics,
      updatedAt: new Date().toISOString(),
    })
    setAnalyticsEnabled(analytics === 'granted')
    setVisible(false)
  }

  return (
    <aside className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-3xl rounded border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 p-4 shadow-xl backdrop-blur">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Cookie を使用してサイト品質を改善します。必須 Cookie は常に有効です。解析 Cookie は同意後にのみ有効になります。
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => decide('granted')}
          className="inline-flex items-center justify-center bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700"
        >
          同意する
        </button>
        <button
          onClick={() => decide('denied')}
          className="inline-flex items-center justify-center border border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-700 dark:text-gray-300"
        >
          必須のみ
        </button>
        <Link to={ROUTES.LEGAL_COOKIE} className="text-xs text-gray-500 dark:text-gray-400 underline-offset-2 hover:underline">
          Cookie ポリシー
        </Link>
      </div>
    </aside>
  )
}
