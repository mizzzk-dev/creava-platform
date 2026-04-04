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
  { key: 'nav.news',    to: ROUTES.NEWS    },
  { key: 'nav.blog',    to: ROUTES.BLOG    },
  { key: 'nav.events',  to: ROUTES.EVENTS  },
  { key: 'nav.store',   to: ROUTES.STORE   },
  { key: 'nav.about',   to: ROUTES.ABOUT   },
  { key: 'nav.contact', to: ROUTES.CONTACT },
] as const

/** AuthButton は Fanclub・Store ページのみ表示 */
function useShowAuth() {
  const { pathname } = useLocation()
  return pathname.startsWith(ROUTES.FANCLUB) || pathname.startsWith(ROUTES.STORE)
}

export default function Header() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const showAuth = useShowAuth()

  useEffect(() => { setIsOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow duration-300 ${
        scrolled
          ? 'shadow-[0_1px_12px_rgba(0,0,0,0.07)] dark:shadow-[0_1px_12px_rgba(0,0,0,0.4)]'
          : ''
      } glass dark:border-b dark:border-gray-800/60 border-b border-gray-100/80`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
        {/* logo */}
        <NavLink
          to={ROUTES.HOME}
          className="transition-opacity hover:opacity-70"
          aria-label="mizzz Home"
        >
          <SiteLogo />
        </NavLink>

        {/* desktop nav */}
        <div className="hidden items-center gap-2 md:flex">
          <nav>
            <ul className="flex items-center gap-0.5">
              {NAV_ITEMS.map(({ key, to }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `relative rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ${
                        isActive
                          ? 'font-medium text-gray-900 bg-gray-100/80 dark:text-gray-100 dark:bg-gray-800/80'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/50'
                      }`
                    }
                  >
                    {t(key)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-2 flex items-center gap-1 border-l border-gray-200/70 dark:border-gray-700/50 pl-3">
            <LangSwitcher />
            <ThemeToggle />
            {showAuth && <AuthButton />}
          </div>
        </div>

        {/* mobile controls */}
        <div className="flex items-center gap-1 md:hidden">
          <LangSwitcher />
          <ThemeToggle />
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="flex h-8 w-8 flex-col items-center justify-center gap-[5px]"
            aria-label={isOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={isOpen}
          >
            <span className={`block h-px w-5 bg-gray-600 dark:bg-gray-400 transition-all duration-300 origin-center ${isOpen ? 'translate-y-[3.5px] rotate-45' : ''}`} />
            <span className={`block h-px w-5 bg-gray-600 dark:bg-gray-400 transition-opacity duration-300 ${isOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-px w-5 bg-gray-600 dark:bg-gray-400 transition-all duration-300 origin-center ${isOpen ? '-translate-y-[9px] -rotate-45' : ''}`} />
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
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-gray-100/80 dark:border-gray-800/80 md:hidden"
          >
            <nav className="bg-white/96 dark:bg-gray-900/96 px-4 pb-6 pt-3 backdrop-blur-md">
              <ul className="flex flex-col divide-y divide-gray-50 dark:divide-gray-800">
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
              {showAuth && (
                <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <AuthButton />
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
