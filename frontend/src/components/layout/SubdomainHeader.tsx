import { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import ThemeToggle from '@/components/common/ThemeToggle'
import LangSwitcher from '@/components/common/LangSwitcher'
import SmartLink from '@/components/common/SmartLink'
import SiteLogo from '@/components/layout/SiteLogo'
import { ROUTES } from '@/lib/routeConstants'
import { mainLink, storeLink, fanclubLink } from '@/lib/siteLinks'
import AuthButton from '@/components/auth/AuthButton'
import SubdomainAnnouncementBar from '@/components/common/SubdomainAnnouncementBar'
import { trackCtaClick } from '@/modules/analytics/tracking'
import { useCart } from '@/modules/cart/context'

interface NavItem {
  to: string
  labelKey: string
}

interface SubdomainHeaderProps {
  site: 'store' | 'fanclub'
  navItems: NavItem[]
  showAuth?: boolean
}

export default function SubdomainHeader({ site, navItems, showAuth = false }: SubdomainHeaderProps) {
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const { itemCount } = useCart()

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 16)
      const max = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(max > 0 ? y / max : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const accentColor = site === 'store' ? 'rgba(6,182,212,' : 'rgba(139,92,246,'

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${
        scrolled
          ? 'border-[rgba(6,182,212,0.15)] bg-[rgba(6,6,15,0.92)] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
          : 'border-[rgba(6,182,212,0.08)] bg-[rgba(6,6,15,0.85)]'
      }`}
    >
      <SubdomainAnnouncementBar site={site} />

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        {/* logo + site label */}
        <SmartLink
          to={site === 'store' ? storeLink('/') : fanclubLink('/')}
          className="inline-flex items-center gap-2.5"
          aria-label="mizzz top"
        >
          <SiteLogo />
          <div className="hidden sm:block">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/40">mizzz</p>
            <p
              className="font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{ color: `${accentColor}0.7)` }}
            >
              {site === 'store' ? t('subdomain.storeLabel') : t('subdomain.fanclubLabel')}
            </p>
          </div>
        </SmartLink>

        {/* desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Subdomain navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => trackCtaClick(`header_${site}`, 'nav_click', { target: item.to })}
              className={({ isActive }) =>
                `relative px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  isActive
                    ? 'text-cyan-400'
                    : 'text-[rgba(180,190,220,0.45)] hover:text-cyan-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {t(item.labelKey)}
                  {isActive && (
                    <motion.div
                      layoutId={`subdomain-nav-${site}`}
                      className="absolute bottom-0 left-0 right-0 h-px"
                      style={{ background: `linear-gradient(to right, transparent, ${accentColor}0.6), transparent)` }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* right controls */}
        <div className="flex items-center gap-1.5">
          {/* site switcher */}
          <div className="hidden items-center gap-px border border-[rgba(6,182,212,0.15)] bg-[rgba(6,6,15,0.6)] px-1 py-1 md:flex">
            {[
              { to: storeLink('/'),   label: 'Store', key: 'network_store'   },
              { to: fanclubLink('/'), label: 'FC',    key: 'network_fanclub' },
              { to: mainLink('/'),    label: 'Main',  key: 'network_main'    },
            ].map(({ to, label, key }) => (
              <SmartLink
                key={key}
                to={to}
                onClick={() => trackCtaClick(`header_${site}`, key)}
                className="px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-[rgba(6,182,212,0.35)] transition-colors hover:text-cyan-400"
              >
                {label}
              </SmartLink>
            ))}
          </div>

          {/* contact link */}
          <div className="hidden lg:block">
            <SmartLink
              to={mainLink(ROUTES.CONTACT)}
              onClick={() => trackCtaClick(`header_${site}`, 'contact_to_main')}
              className="btn-cyber-ghost focus-ring inline-flex items-center gap-1.5 text-xs"
            >
              {t('subdomain.contactMain')}
            </SmartLink>
          </div>

          <LangSwitcher />
          <ThemeToggle />
          {showAuth && <AuthButton />}

          {/* cart icon (store only) */}
          {site === 'store' && (
            <Link
              to={ROUTES.CART}
              onClick={() => trackCtaClick('header_store', 'cart_click')}
              aria-label={t('cart.goToCart', { defaultValue: 'カートを見る' })}
              className="relative flex h-9 w-9 items-center justify-center border border-[rgba(6,182,212,0.2)] text-cyan-400/70 transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
            >
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" aria-hidden="true">
                <path d="M3 5h2l2 11h10l2-8H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="19" r="1.5" fill="currentColor" />
                <circle cx="17" cy="19" r="1.5" fill="currentColor" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400 px-1 text-[9px] font-bold text-gray-950">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {/* mobile hamburger */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center border border-[rgba(6,182,212,0.2)] text-cyan-400/60 transition-colors hover:border-cyan-500/40 hover:text-cyan-400 md:hidden"
            aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            onClick={() => {
              trackCtaClick(`mobile_header_${site}`, 'drawer_toggle', { open: !mobileOpen })
              setMobileOpen((prev) => !prev)
            }}
          >
            <motion.div
              animate={mobileOpen ? 'open' : 'closed'}
              className="flex h-4 w-4 flex-col items-center justify-center gap-1"
            >
              <motion.span
                variants={{ open: { rotate: 45, y: 5 }, closed: { rotate: 0, y: 0 } }}
                className="block h-px w-3.5 bg-current transition-transform"
              />
              <motion.span
                variants={{ open: { opacity: 0, x: -4 }, closed: { opacity: 1, x: 0 } }}
                className="block h-px w-3.5 bg-current"
              />
              <motion.span
                variants={{ open: { rotate: -45, y: -5 }, closed: { rotate: 0, y: 0 } }}
                className="block h-px w-3.5 bg-current transition-transform"
              />
            </motion.div>
          </button>
        </div>
      </div>

      {/* scroll progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-px origin-left"
        style={{
          width: `${scrollProgress * 100}%`,
          background: `linear-gradient(to right, ${accentColor}0.6), rgba(139,92,246,0.4))`,
        }}
      />

      {/* mobile drawer */}
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="border-t border-[rgba(6,182,212,0.1)] bg-[rgba(6,6,15,0.95)] px-4 py-4 md:hidden"
          >
            <div className="grid gap-1.5">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                >
                  <NavLink
                    to={item.to}
                    onClick={() => {
                      setMobileOpen(false)
                      trackCtaClick(`mobile_header_${site}`, 'nav_click', { target: item.to })
                    }}
                    className={({ isActive }) =>
                      `block px-3 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                        isActive ? 'text-cyan-400' : 'text-[rgba(180,190,220,0.45)] hover:text-cyan-400'
                      }`
                    }
                  >
                    {t(item.labelKey)}
                  </NavLink>
                </motion.div>
              ))}
              {site === 'store' && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.04, duration: 0.2 }}
                >
                  <Link
                    to={ROUTES.CART}
                    onClick={() => {
                      setMobileOpen(false)
                      trackCtaClick('mobile_header_store', 'cart_click')
                    }}
                    className="flex items-center justify-between px-3 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[rgba(180,190,220,0.45)] transition-colors hover:text-cyan-400"
                  >
                    <span>{t('cart.goToCart', { defaultValue: 'カート' })}</span>
                    {itemCount > 0 && (
                      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400 px-1 text-[9px] font-bold text-gray-950">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                </motion.div>
              )}
              <div className="mt-2 border-t border-[rgba(6,182,212,0.08)] pt-2">
                <SmartLink
                  to={mainLink(ROUTES.CONTACT)}
                  onClick={() => trackCtaClick(`mobile_header_${site}`, 'contact_to_main')}
                  className="block px-3 py-2.5 font-mono text-[10px] uppercase tracking-widest text-cyan-500/40 transition-colors hover:text-cyan-400"
                >
                  {t('subdomain.contactMain')} →
                </SmartLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
