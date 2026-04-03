import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import AuthButton from '@/components/auth/AuthButton'
import ThemeToggle from '@/components/common/ThemeToggle'
import LangSwitcher from '@/components/common/LangSwitcher'
import SiteLogo from '@/components/layout/SiteLogo'

const NAV_ITEMS = [
  { key: 'nav.works',   to: ROUTES.WORKS   },
  { key: 'nav.news',    to: ROUTES.NEWS    },
  { key: 'nav.blog',    to: ROUTES.BLOG    },
  { key: 'nav.events',  to: ROUTES.EVENTS  },
  { key: 'nav.fanclub', to: ROUTES.FANCLUB },
  { key: 'nav.contact', to: ROUTES.CONTACT },
] as const

export default function Header() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => { setIsOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <header className="glass sticky top-0 z-50 border-b border-gray-100/80 dark:border-gray-800/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        {/* logo */}
        <NavLink
          to={ROUTES.HOME}
          className="transition-opacity hover:opacity-70"
          aria-label="Creava Home"
        >
          <SiteLogo />
        </NavLink>

        {/* desktop nav */}
        <div className="hidden items-center gap-3 md:flex">
          <nav>
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map(({ key, to }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `relative rounded px-3 py-1.5 text-sm transition-colors duration-150 ${
                        isActive
                          ? 'font-medium text-gray-900 bg-gray-50 dark:text-gray-100 dark:bg-gray-800'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/60 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/60'
                      }`
                    }
                  >
                    {t(key)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-1 border-l border-gray-100 dark:border-gray-800 pl-3">
            <LangSwitcher />
            <ThemeToggle />
            <AuthButton />
          </div>
        </div>

        {/* mobile controls */}
        <div className="flex items-center gap-1 md:hidden">
          <LangSwitcher />
          <ThemeToggle />
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="flex h-8 w-8 flex-col items-center justify-center gap-1.5"
            aria-label={isOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={isOpen}
          >
            <span className={`block h-px w-5 bg-gray-700 dark:bg-gray-300 transition-transform duration-300 ${isOpen ? 'translate-y-[3px] rotate-45' : ''}`} />
            <span className={`block h-px w-5 bg-gray-700 dark:bg-gray-300 transition-opacity duration-300 ${isOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-px w-5 bg-gray-700 dark:bg-gray-300 transition-transform duration-300 ${isOpen ? '-translate-y-[9px] -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-gray-100/80 dark:border-gray-800/80 md:hidden"
          >
            <nav className="bg-white/95 dark:bg-gray-900/95 px-4 pb-6 pt-4">
              <ul className="flex flex-col">
                {NAV_ITEMS.map(({ key, to }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        `block py-3 text-sm transition-colors ${
                          isActive
                            ? 'font-medium text-gray-900 dark:text-gray-100'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                        }`
                      }
                    >
                      {t(key)}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                <AuthButton />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
