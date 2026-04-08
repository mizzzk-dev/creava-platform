import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import CookieConsentBanner from '@/components/common/CookieConsentBanner'
import ThemeToggle from '@/components/common/ThemeToggle'
import LangSwitcher from '@/components/common/LangSwitcher'
import { ROUTES } from '@/lib/routeConstants'
import { MAIN_SITE_URL } from '@/lib/siteLinks'

const NAV_ITEMS = [
  { to: ROUTES.STORE_HOME, label: 'Home' },
  { to: ROUTES.STORE_PRODUCTS, label: 'Products' },
  { to: '/collections/digital', label: 'Digital' },
  { to: ROUTES.NEWS, label: 'News' },
  { to: ROUTES.FAQ, label: 'FAQ' },
  { to: ROUTES.STORE_GUIDE, label: 'Guide' },
]

const FOOTER_LINKS = [
  { to: ROUTES.STORE_GUIDE, label: 'ガイド' },
  { to: ROUTES.STORE_SHIPPING_POLICY, label: '配送ポリシー' },
  { to: ROUTES.STORE_RETURNS, label: '返品・交換' },
  { to: ROUTES.FAQ, label: 'FAQ' },
  { to: ROUTES.STORE_TERMS, label: '利用規約' },
  { to: ROUTES.STORE_PRIVACY, label: 'プライバシー' },
  { to: ROUTES.LEGAL_TRADE, label: '特定商取引法表記' },
]

export default function StoreLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <NavLink to={ROUTES.STORE_HOME} className="font-mono text-sm tracking-wide">mizzz Official Store</NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <LangSwitcher />
            <ThemeToggle />
            <NavLink to={ROUTES.STORE_CART} className="rounded-full border border-gray-300 px-3 py-1.5 text-xs dark:border-gray-700">Cart</NavLink>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-700 md:hidden dark:border-gray-700 dark:text-gray-300"
              aria-label="メニュー"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              ☰
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-gray-200 px-4 py-3 md:hidden dark:border-gray-800">
            <div className="grid gap-2">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to}>{link.label}</NavLink>
            ))}
            <a href={`${MAIN_SITE_URL}/contact`} className="underline-offset-2 hover:underline">お問い合わせ（メインサイト）</a>
            <a href={MAIN_SITE_URL} className="underline-offset-2 hover:underline">mizzz.jp</a>
          </div>
          <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-600">
            ストアに関するお問い合わせは mizzz.jp のお問い合わせページから受け付けています。
          </p>
        </div>
      </footer>
      <CookieConsentBanner />
    </div>
  )
}
