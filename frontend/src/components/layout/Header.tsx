import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import SmartLink from '@/components/common/SmartLink'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import { fanclubLink, storeLink, isAbsoluteUrl } from '@/lib/siteLinks'
import AuthButton from '@/components/auth/AuthButton'
import ThemeToggle from '@/components/common/ThemeToggle'
import LangSwitcher from '@/components/common/LangSwitcher'
import SiteLogo from '@/components/layout/SiteLogo'
import { prefetchRoute } from '@/lib/routePrefetch'

const NAV_ITEMS = [
  { key: 'nav.news',    to: ROUTES.NEWS },
  { key: 'nav.blog',    to: ROUTES.BLOG },
  { key: 'nav.events',  to: ROUTES.EVENTS },
  { key: 'nav.store',   to: storeLink(ROUTES.STORE) },
  { key: 'nav.fanclub', to: fanclubLink(ROUTES.FANCLUB) },
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
  const [scrolled, setScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const { pathname } = useLocation()
  const showAuth = useShowAuth()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY
      setScrolled(y > 10)
      const docH = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(docH > 0 ? Math.min(y / docH, 1) : 0)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-xl dark:border-[rgba(6,182,212,0.12)] dark:bg-[rgba(6,6,15,0.92)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
          : 'border-gray-100/60 bg-white/80 backdrop-blur-lg dark:border-[rgba(6,182,212,0.06)] dark:bg-[rgba(6,6,15,0.75)]'
      } border-b`}
    >
      {/* ── Scroll progress bar ───────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-transparent transition-all duration-100"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
        <NavLink to={ROUTES.HOME} className="transition-opacity hover:opacity-70" aria-label="mizzz Home">
          <SiteLogo />
        </NavLink>

        {/* ── Desktop nav ──────────────────────────────── */}
        <div className="hidden items-center gap-2 md:flex">
          <nav>
            <ul className="flex items-center gap-0.5">
              {NAV_ITEMS.map(({ key, to }) => (
                <li key={to}>
                  {isAbsoluteUrl(to) ? (
                    <a
                      href={to}
                      className="focus-ring relative rounded-md px-3 py-1.5 text-sm text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 dark:text-[rgba(120,140,180,0.7)] dark:hover:bg-[rgba(6,182,212,0.05)] dark:hover:text-cyan-300"
                    >
                      {t(key)}
                    </a>
                  ) : (
                    <NavLink
                      to={to}
                      onMouseEnter={() => prefetchRoute(to)}
                      onFocus={() => prefetchRoute(to)}
                      onTouchStart={() => prefetchRoute(to)}
                      className={({ isActive }) =>
                        `focus-ring relative rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ${
                          isActive
                            ? 'bg-gray-100 font-medium text-gray-900 dark:bg-[rgba(6,182,212,0.1)] dark:text-cyan-300'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[rgba(120,140,180,0.7)] dark:hover:bg-[rgba(6,182,212,0.05)] dark:hover:text-cyan-300'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {t(key)}
                          {isActive && (
                            <motion.span
                              layoutId="nav-indicator"
                              className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-gray-400/60 via-gray-600/80 to-gray-400/60 dark:from-cyan-500/80 dark:via-cyan-400 dark:to-cyan-500/80"
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-2 flex items-center gap-2 border-l border-gray-200 dark:border-[rgba(6,182,212,0.12)] pl-3">
            <LangSwitcher />
            <ThemeToggle />
            {showAuth && <AuthButton />}
          </div>
        </div>

        {/* ── Mobile controls ───────────────────────────── */}
        <div className="flex items-center gap-1 md:hidden">
          <LangSwitcher />
          <ThemeToggle />
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="flex h-8 w-8 flex-col items-center justify-center gap-[5px]"
            aria-label={isOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={isOpen}
          >
            <motion.span
              animate={isOpen ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
              className="block h-px w-5 origin-center bg-gray-700 dark:bg-cyan-400/70"
            />
            <motion.span
              animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.2 }}
              className="block h-px w-5 bg-gray-700 dark:bg-cyan-400/70"
            />
            <motion.span
              animate={isOpen ? { rotate: -45, y: -9 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
              className="block h-px w-5 origin-center bg-gray-700 dark:bg-cyan-400/70"
            />
          </button>
        </div>
      </div>

      {/* ── Mobile menu ──────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-gray-100 dark:border-[rgba(6,182,212,0.1)] md:hidden"
          >
            <nav className="bg-white/98 px-4 pb-6 pt-3 backdrop-blur-xl dark:bg-[rgba(6,6,15,0.97)]">
              <ul className="flex flex-col divide-y divide-gray-100 dark:divide-[rgba(6,182,212,0.06)]">
                {NAV_ITEMS.map(({ key, to }, i) => (
                  <motion.li
                    key={to}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <SmartLink
                      to={to}
                      onMouseEnter={() => !isAbsoluteUrl(to) && prefetchRoute(to)}
                      onFocus={() => !isAbsoluteUrl(to) && prefetchRoute(to)}
                      onTouchStart={() => !isAbsoluteUrl(to) && prefetchRoute(to)}
                      className="group flex items-center justify-between py-3 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-[rgba(120,140,180,0.7)] dark:hover:text-cyan-400"
                    >
                      <span>{t(key)}</span>
                      <span className="font-mono text-[9px] text-transparent transition-colors duration-200 group-hover:text-gray-400 dark:group-hover:text-cyan-500/40">
                        →
                      </span>
                    </SmartLink>
                  </motion.li>
                ))}
              </ul>
              {showAuth && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: NAV_ITEMS.length * 0.04 + 0.1 }}
                  className="mt-4 border-t border-gray-100 pt-4 dark:border-[rgba(6,182,212,0.08)]"
                >
                  <AuthButton />
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
