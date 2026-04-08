import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ThemeToggle from '@/components/common/ThemeToggle'
import LangSwitcher from '@/components/common/LangSwitcher'
import SmartLink from '@/components/common/SmartLink'
import SiteLogo from '@/components/layout/SiteLogo'
import { ROUTES } from '@/lib/routeConstants'
import { mainLink, storeLink, fanclubLink } from '@/lib/siteLinks'
import AuthButton from '@/components/auth/AuthButton'

interface NavItem {
  to: string
  label: string
}

interface SubdomainHeaderProps {
  site: 'store' | 'fanclub'
  navItems: NavItem[]
  showAuth?: boolean
}

export default function SubdomainHeader({ site, navItems, showAuth = false }: SubdomainHeaderProps) {
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/85 backdrop-blur-xl dark:border-gray-800/70 dark:bg-gray-950/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5">
        <SmartLink to={site === 'store' ? storeLink('/') : fanclubLink('/')} className="inline-flex items-center gap-2.5" aria-label="mizzz top">
          <SiteLogo />
          <div className="hidden sm:block">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">mizzz</p>
            <p className="text-xs font-medium tracking-[0.14em] text-gray-800 dark:text-gray-100">{site === 'store' ? 'STORE' : 'FANCLUB'}</p>
          </div>
        </SmartLink>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Subdomain navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `rounded-full px-3 py-1.5 text-sm transition-colors ${isActive ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <div className="hidden lg:block">
            <SmartLink
              to={mainLink(ROUTES.CONTACT)}
              className="rounded-full border border-gray-200 bg-white/85 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-200 dark:hover:border-gray-500"
            >
              {t('nav.contact')} · mizzz.jp
            </SmartLink>
          </div>
          <LangSwitcher />
          <ThemeToggle />
          {showAuth && <AuthButton />}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-700 md:hidden dark:border-gray-700 dark:text-gray-300"
            aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? '×' : '☰'}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200/70 bg-white/90 px-4 py-4 md:hidden dark:border-gray-800/70 dark:bg-gray-950/90">
          <div className="grid gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `rounded-xl px-3 py-2.5 text-sm ${isActive ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}
              >
                {item.label}
              </NavLink>
            ))}
            <SmartLink to={mainLink(ROUTES.CONTACT)} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
              {t('nav.contact')} (mizzz.jp)
            </SmartLink>
          </div>
        </div>
      )}
    </header>
  )
}
