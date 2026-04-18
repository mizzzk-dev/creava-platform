import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/lib/routeConstants'
import { trackPageView } from '@/modules/analytics'
import { initializeAnalytics } from '@/modules/analytics'
import { COOKIE_CONSENT_EVENT, loadCookieConsent, setAnalyticsEnabled } from '@/modules/cookie/consent'
import SubdomainHeader from '@/components/layout/SubdomainHeader'
import SubdomainFooter from '@/components/layout/SubdomainFooter'
import LoadingScreen from '@/components/common/LoadingScreen'
import CookieConsentBanner from '@/components/common/CookieConsentBanner'
import NewYearExperience from '@/modules/seasonal/NewYearExperience'
import { SeasonalThemeProvider } from '@/modules/seasonal/context'

const NAV_ITEMS = [
  { labelKey: 'nav.about', to: ROUTES.FC_ABOUT },
  { labelKey: 'subdomain.fanclubNav.join', to: ROUTES.FC_JOIN },
  { labelKey: 'nav.news', to: ROUTES.NEWS },
  { labelKey: 'nav.blog', to: ROUTES.BLOG },
  { labelKey: 'subdomain.fanclubNav.movies', to: ROUTES.FC_MOVIES },
  { labelKey: 'subdomain.fanclubNav.gallery', to: ROUTES.FC_GALLERY },
  { labelKey: 'nav.events', to: ROUTES.EVENTS },
  { labelKey: 'subdomain.fanclubNav.mypage', to: ROUTES.FC_MYPAGE },
]

const LEGAL_LINKS = [
  { to: ROUTES.FC_TERMS, labelKey: 'footer.terms' },
  { to: ROUTES.FC_PRIVACY, labelKey: 'footer.privacy' },
  { to: ROUTES.FC_COMMERCE_LAW, labelKey: 'footer.trade' },
  { to: ROUTES.FC_SUBSCRIPTION_POLICY, labelKey: 'fanclub.subscriptionPolicy' },
]

export default function FanclubLayout() {
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
    <SeasonalThemeProvider site="fanclub">
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <SubdomainHeader site="fanclub" navItems={NAV_ITEMS} showAuth />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <SubdomainFooter legalLinks={LEGAL_LINKS} />
      <CookieConsentBanner />
      <LoadingScreen />
      <NewYearExperience site="fanclub" />
    </div>
    </SeasonalThemeProvider>
  )
}
