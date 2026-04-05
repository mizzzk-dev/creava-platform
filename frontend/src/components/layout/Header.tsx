import { useState, useEffect } from 'react'
import { NavLink, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import AuthButton from '@/components/auth/AuthButton'
import ThemeToggle from '@/components/common/ThemeToggle'
import LangSwitcher from '@/components/common/LangSwitcher'
import SiteLogo from '@/components/layout/SiteLogo'
import { useCart } from '@/modules/cart/context'

const NAV_ITEMS = [
  { key: 'nav.news', to: ROUTES.NEWS },
  { key: 'nav.blog', to: ROUTES.BLOG },
  { key: 'nav.events', to: ROUTES.EVENTS },
  { key: 'nav.store', to: ROUTES.STORE },
  { key: 'nav.fanclub', to: ROUTES.FANCLUB },
  { key: 'nav.contact', to: ROUTES.CONTACT },
] as const

function useShowAuth() {
  const { pathname } = useLocation()
  return (
    pathname.startsWith(ROUTES.FANCLUB) ||
    pathname.startsWith(ROUTES.STORE) ||
    pathname.startsWith(ROUTES.MEMBER)
  )
}

export default function Header() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [showFloatingCart, setShowFloatingCart] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const showAuth = useShowAuth()
  const { itemCount } = useCart()

  useEffect(() => {
    setIsOpen(false)
    setShowFloatingCart(true)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-gray-200/90 bg-white/92 shadow-[0_6px_28px_rgba(0,0,0,0.08)] backdrop-blur-lg dark:border-gray-800/85 dark:bg-gray-950/92 dark:shadow-[0_6px_28px_rgba(0,0,0,0.45)]'
          : 'border-gray-100/80 bg-white/86 backdrop-blur-md dark:border-gray-800/60 dark:bg-gray-950/80'
      } border-b`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
        <NavLink to={ROUTES.HOME} className="transition-opacity hover:opacity-70" aria-label="mizzz Home">
          <SiteLogo />
        </NavLink>

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
                          ? 'bg-gray-100/80 font-medium text-gray-900 dark:bg-gray-800/80 dark:text-gray-100'
                          : 'text-gray-500 hover:bg-gray-100/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-100'
                      }`
                    }
                  >
                    {t(key)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-2 flex items-center gap-2 border-l border-gray-200/70 dark:border-gray-700/50 pl-3">
            <Link
              to={ROUTES.MEMBER}
              className={`rounded px-1.5 py-1 text-xs transition-colors ${
                pathname.startsWith(ROUTES.MEMBER)
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              {t('nav.member', { defaultValue: 'member' })}
            </Link>
            <LangSwitcher />
            <ThemeToggle />
            {showAuth && <AuthButton />}
          </div>
        </div>

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
                <li>
                  <NavLink to={ROUTES.MEMBER} className="block py-3 text-sm text-gray-500 dark:text-gray-400">
                    {t('nav.member', { defaultValue: 'member' })}
                  </NavLink>
                </li>
                <li>
                  <NavLink to={ROUTES.CART} className="block py-3 text-sm text-gray-500 dark:text-gray-400">
                    {t('footer.cart', { defaultValue: 'カート' })}
                  </NavLink>
                </li>
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

      {showFloatingCart && !pathname.startsWith(ROUTES.CART) && (
        <div className="pointer-events-none fixed bottom-5 right-5 z-[60]">
          <div className="pointer-events-auto relative">
            <button
              type="button"
              onClick={() => setShowFloatingCart(false)}
              aria-label={t('cart.hideFloating', { defaultValue: 'カートアイコンを閉じる' })}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-[10px] leading-none text-gray-500 shadow-sm transition hover:text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              ×
            </button>
            <Link
              to={ROUTES.CART}
              className="relative flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:scale-[1.03] hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:text-white"
              aria-label={t('cart.goToCart', { defaultValue: 'カートを見る' })}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path d="M3 5h2l2 11h10l2-8H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="19" r="1.5" fill="currentColor" />
                <circle cx="17" cy="19" r="1.5" fill="currentColor" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] text-white dark:bg-gray-100 dark:text-gray-900">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
