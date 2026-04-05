import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import PreviewBanner from '@/components/common/PreviewBanner'
import LoadingScreen from '@/components/common/LoadingScreen'
import CookieConsentBanner from '@/components/common/CookieConsentBanner'
import { COOKIE_CONSENT_EVENT, loadCookieConsent, setAnalyticsEnabled } from '@/modules/cookie/consent'
import { initializeAnalytics, trackPageView } from '@/modules/analytics'

export default function MainLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    const applyConsent = () => {
      const consent = loadCookieConsent()
      const enabled = consent?.analytics === 'granted'
      setAnalyticsEnabled(enabled)
      initializeAnalytics(enabled)
    }

    applyConsent()
    window.addEventListener(COOKIE_CONSENT_EVENT, applyConsent)

    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, applyConsent)
    }
  }, [])

  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  return (
    <>
      <LoadingScreen />
      <div className="flex min-h-screen flex-col">
        <PreviewBanner />
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <CookieConsentBanner />
      </div>
    </>
  )
}
