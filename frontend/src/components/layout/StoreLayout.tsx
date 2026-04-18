import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import CookieConsentBanner from '@/components/common/CookieConsentBanner'
import LoadingScreen from '@/components/common/LoadingScreen'
import NewYearExperience from '@/modules/seasonal/NewYearExperience'
import { SeasonalThemeProvider } from '@/modules/seasonal/context'
import SubdomainHeader from '@/components/layout/SubdomainHeader'
import SubdomainFooter from '@/components/layout/SubdomainFooter'
import { ROUTES } from '@/lib/routeConstants'
import { initializeAnalytics, trackPageView } from '@/modules/analytics'
import { COOKIE_CONSENT_EVENT, loadCookieConsent, setAnalyticsEnabled } from '@/modules/cookie/consent'

const NAV_ITEMS = [
  { to: ROUTES.STORE_HOME, labelKey: 'nav.home' },
  { to: ROUTES.STORE_PRODUCTS, labelKey: 'subdomain.storeNav.products' },
  { to: '/collections/digital', labelKey: 'subdomain.storeNav.digital' },
  { to: ROUTES.NEWS, labelKey: 'nav.news' },
  { to: ROUTES.FAQ, labelKey: 'nav.faq' },
  { to: ROUTES.STORE_GUIDE, labelKey: 'subdomain.storeNav.guide' },
]

const LEGAL_LINKS = [
  { to: ROUTES.STORE_SHIPPING_POLICY, labelKey: 'store.shippingPolicy' },
  { to: ROUTES.STORE_RETURNS, labelKey: 'store.returnsPolicy' },
  { to: ROUTES.STORE_TERMS, labelKey: 'footer.terms' },
  { to: ROUTES.STORE_PRIVACY, labelKey: 'footer.privacy' },
  { to: ROUTES.LEGAL_TRADE, labelKey: 'footer.trade' },
]

export default function StoreLayout() {
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
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, applyConsent)
  }, [])

  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  return (
    <SeasonalThemeProvider site="store">
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <SubdomainHeader site="store" navItems={NAV_ITEMS} />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <SubdomainFooter legalLinks={LEGAL_LINKS} />
      <CookieConsentBanner />
      <LoadingScreen />
      <NewYearExperience site="store" />
    </div>
    </SeasonalThemeProvider>
  )
}
