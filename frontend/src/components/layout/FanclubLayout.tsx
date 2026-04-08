import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/lib/routeConstants'
import { trackPageView } from '@/modules/analytics'
import SubdomainHeader from '@/components/layout/SubdomainHeader'
import SubdomainFooter from '@/components/layout/SubdomainFooter'

const NAV_ITEMS = [
  { label: 'About', to: ROUTES.FC_ABOUT },
  { label: 'Join', to: ROUTES.FC_JOIN },
  { label: 'News', to: ROUTES.NEWS },
  { label: 'Blog', to: ROUTES.BLOG },
  { label: 'Movies', to: ROUTES.FC_MOVIES },
  { label: 'Gallery', to: ROUTES.FC_GALLERY },
  { label: 'Events', to: ROUTES.EVENTS },
  { label: 'My Page', to: ROUTES.FC_MYPAGE },
]

const LEGAL_LINKS = [
  { to: ROUTES.FC_TERMS, label: '利用規約' },
  { to: ROUTES.FC_PRIVACY, label: 'プライバシー' },
  { to: ROUTES.FC_COMMERCE_LAW, label: '特商法表記' },
  { to: ROUTES.FC_SUBSCRIPTION_POLICY, label: 'サブスクポリシー' },
]

export default function FanclubLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <SubdomainHeader site="fanclub" navItems={NAV_ITEMS} showAuth />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <SubdomainFooter legalLinks={LEGAL_LINKS} />
    </div>
  )
}
