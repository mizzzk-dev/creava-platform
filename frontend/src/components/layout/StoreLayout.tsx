import { Outlet, NavLink } from 'react-router-dom'
import CookieConsentBanner from '@/components/common/CookieConsentBanner'
import { ROUTES } from '@/lib/routeConstants'

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: ROUTES.STORE_PRODUCTS, label: 'All Products' },
  { to: '/collections/digital', label: 'Digital' },
  { to: ROUTES.NEWS, label: 'News' },
  { to: ROUTES.FAQ, label: 'FAQ' },
  { to: ROUTES.STORE_GUIDE, label: 'Guide' },
]

export default function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <NavLink to={ROUTES.STORE_HOME} className="font-mono text-sm tracking-wide">mizzz Official Store</NavLink>
          <nav className="hidden gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <NavLink to={ROUTES.STORE_CART} className="rounded-full border border-gray-300 px-3 py-1.5 text-xs dark:border-gray-700">Cart</NavLink>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <NavLink to="/shipping-policy">配送ポリシー</NavLink>
            <NavLink to="/returns">返品・交換</NavLink>
            <NavLink to="/contact">お問い合わせ</NavLink>
            <NavLink to="/legal/terms">利用規約</NavLink>
            <NavLink to="/legal/privacy-policy">プライバシー</NavLink>
            <NavLink to="/legal/tokushoho">特定商取引法表記</NavLink>
          </div>
        </div>
      </footer>
      <CookieConsentBanner />
    </div>
  )
}
