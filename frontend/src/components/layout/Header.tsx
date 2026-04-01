import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import AuthButton from '@/components/auth/AuthButton'

const NAV_ITEMS = [
  { key: 'nav.works',   to: ROUTES.WORKS   },
  { key: 'nav.news',    to: ROUTES.NEWS    },
  { key: 'nav.blog',    to: ROUTES.BLOG    },
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
    <header className="glass sticky top-0 z-50 border-b border-gray-100/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        {/* logo */}
        <NavLink
          to={ROUTES.HOME}
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-900 transition-opacity hover:opacity-70"
        >
          <span className="font-mono text-[10px] font-medium text-gray-300 select-none">&gt;_</span>
          Creava
        </NavLink>

        {/* desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <nav>
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map(({ key, to }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `relative rounded px-3 py-1.5 text-sm transition-colors duration-150 ${
                        isActive
                          ? 'font-medium text-gray-900 bg-gray-50'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/60'
                      }`
                    }
                  >
                    {t(key)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <AuthButton />
        </div>

        {/* hamburger (mobile) */}
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label={isOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={isOpen}
        >
          <span className={`block h-px w-5 bg-gray-700 transition-transform duration-300 ${isOpen ? 'translate-y-[3px] rotate-45' : ''}`} />
          <span className={`block h-px w-5 bg-gray-700 transition-opacity duration-300 ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-px w-5 bg-gray-700 transition-transform duration-300 ${isOpen ? '-translate-y-[9px] -rotate-45' : ''}`} />
        </button>
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
            className="overflow-hidden border-t border-gray-100/80 md:hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
          >
            <nav className="px-4 pb-6 pt-4">
              <ul className="flex flex-col">
                {NAV_ITEMS.map(({ key, to }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        `block py-3 text-sm transition-colors ${
                          isActive
                            ? 'font-medium text-gray-900'
                            : 'text-gray-500 hover:text-gray-900'
                        }`
                      }
                    >
                      {t(key)}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <AuthButton />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
