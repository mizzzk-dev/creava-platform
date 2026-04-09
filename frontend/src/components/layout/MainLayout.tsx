import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from './Header'
import Footer from './Footer'
import PreviewBanner from '@/components/common/PreviewBanner'
import LoadingScreen from '@/components/common/LoadingScreen'
import CookieConsentBanner from '@/components/common/CookieConsentBanner'
import CustomCursor from '@/components/common/CustomCursor'
import { COOKIE_CONSENT_EVENT, loadCookieConsent, setAnalyticsEnabled } from '@/modules/cookie/consent'
import { initializeAnalytics, trackPageView } from '@/modules/analytics'

export default function MainLayout() {
  const { pathname } = useLocation()
  const { t } = useTranslation()

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
      <CustomCursor />
      <LoadingScreen />
      <div className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-gray-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white dark:focus:bg-gray-100 dark:focus:text-gray-900"
        >
          {t('nav.skipToContent')}
        </a>
        <PreviewBanner />
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <CookieConsentBanner />
      </div>
    </>
  )
}
