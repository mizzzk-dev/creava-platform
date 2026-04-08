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
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <SmartLink to={site === 'store' ? storeLink('/') : fanclubLink('/')} className="inline-flex items-center gap-2" aria-label="mizzz top">
          <SiteLogo />
          <span className="hidden text-xs text-gray-500 dark:text-gray-400 sm:inline">{site === 'store' ? 'STORE' : 'FANCLUB'}</span>
        </SmartLink>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Subdomain navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <LangSwitcher />
          <ThemeToggle />
          {showAuth && <AuthButton />}
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-700 md:hidden dark:border-gray-700 dark:text-gray-300"
            aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            ☰
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 px-4 py-3 md:hidden dark:border-gray-800">
          <div className="grid gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}
              >
                {item.label}
              </NavLink>
            ))}
            <SmartLink to={mainLink(ROUTES.CONTACT)} className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
              {t('nav.contact')} (mizzz.jp)
            </SmartLink>
          </div>
        </div>
      )}
    </header>
  )
}
