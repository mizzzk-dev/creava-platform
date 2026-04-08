import { Outlet } from 'react-router-dom'
import CookieConsentBanner from '@/components/common/CookieConsentBanner'
import SubdomainHeader from '@/components/layout/SubdomainHeader'
import SubdomainFooter from '@/components/layout/SubdomainFooter'
import { ROUTES } from '@/lib/routeConstants'

const NAV_ITEMS = [
  { to: ROUTES.STORE_HOME, label: 'Home' },
  { to: ROUTES.STORE_PRODUCTS, label: 'Products' },
  { to: '/collections/digital', label: 'Digital' },
  { to: ROUTES.NEWS, label: 'News' },
  { to: ROUTES.FAQ, label: 'FAQ' },
  { to: ROUTES.STORE_GUIDE, label: 'Guide' },
]

const LEGAL_LINKS = [
  { to: ROUTES.STORE_SHIPPING_POLICY, label: '配送ポリシー' },
  { to: ROUTES.STORE_RETURNS, label: '返品・交換' },
  { to: ROUTES.STORE_TERMS, label: '利用規約' },
  { to: ROUTES.STORE_PRIVACY, label: 'プライバシー' },
  { to: ROUTES.LEGAL_TRADE, label: '特商法表記' },
]

export default function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <SubdomainHeader site="store" navItems={NAV_ITEMS} />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <SubdomainFooter legalLinks={LEGAL_LINKS} />
      <CookieConsentBanner />
    </div>
  )
}
