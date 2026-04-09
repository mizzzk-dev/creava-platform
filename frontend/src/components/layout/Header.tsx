import { useRef, useState, useEffect, type PointerEvent as ReactPointerEvent } from 'react'
import { NavLink, useLocation, Link } from 'react-router-dom'
import SmartLink from '@/components/common/SmartLink'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import { fanclubLink, storeLink, isAbsoluteUrl } from '@/lib/siteLinks'
import AuthButton from '@/components/auth/AuthButton'
import ThemeToggle from '@/components/common/ThemeToggle'
import LangSwitcher from '@/components/common/LangSwitcher'
import SiteLogo from '@/components/layout/SiteLogo'
import { useCart } from '@/modules/cart/context'
import { prefetchRoute } from '@/lib/routePrefetch'

const NAV_ITEMS = [
  { key: 'nav.news',    to: ROUTES.NEWS },
  { key: 'nav.blog',    to: ROUTES.BLOG },
  { key: 'nav.events',  to: ROUTES.EVENTS },
  { key: 'nav.store',   to: storeLink(ROUTES.STORE) },
  { key: 'nav.fanclub', to: fanclubLink(ROUTES.FANCLUB) },
  { key: 'nav.request', to: `${ROUTES.CONTACT}?tab=request` },
  { key: 'nav.contact', to: ROUTES.CONTACT },
] as const

type DeviceType = 'mobile' | 'desktop'
const DRAG_HINT_SEEN_KEY = 'floating-cart-drag-hint-seen'

function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop'
  return window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop'
}

function getFloatingCartStorageKey(deviceType: DeviceType): string {
  return `floating-cart-position:${deviceType}`
}

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
  const [deviceType, setDeviceType] = useState<DeviceType>(() => getDeviceType())
  const [floatingPosition, setFloatingPosition] = useState({ x: 0, y: 0 })
  const [showDragHint, setShowDragHint] = useState(false)
  const [isDraggingCart, setIsDraggingCart] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const dragStartTimerRef = useRef<number | null>(null)
  const pointerStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const { pathname } = useLocation()
  const showAuth = useShowAuth()
  const { itemCount } = useCart()

  useEffect(() => {
    setIsOpen(false)
    setShowFloatingCart(true)
  }, [pathname])

  useEffect(() => {
    setDeviceType(getDeviceType())
    const fallback = { x: Math.max(window.innerWidth - 68, 16), y: Math.max(window.innerHeight - 68, 16) }

    try {
      const raw = localStorage.getItem(getFloatingCartStorageKey(getDeviceType()))
      if (!raw) {
        setFloatingPosition(fallback)
        return
      }
      const parsed = JSON.parse(raw) as { x?: number; y?: number }
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        setFloatingPosition({
          x: Math.min(Math.max(parsed.x, 16), window.innerWidth - 56),
          y: Math.min(Math.max(parsed.y, 16), window.innerHeight - 56),
        })
        return
      }
      setFloatingPosition(fallback)
    } catch {
      setFloatingPosition(fallback)
    }
  }, [])

  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem(DRAG_HINT_SEEN_KEY) === '1'
      setShowDragHint(!hasSeen)
    } catch {
      setShowDragHint(true)
    }
  }, [])

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

  useEffect(() => {
    if (floatingPosition.x === 0 && floatingPosition.y === 0) return
    localStorage.setItem(getFloatingCartStorageKey(deviceType), JSON.stringify(floatingPosition))
  }, [deviceType, floatingPosition])

  useEffect(() => {
    const resizeHandler = () => {
      const nextDeviceType = getDeviceType()
      setDeviceType((prev) => {
        if (prev !== nextDeviceType) {
          const fallback = { x: Math.max(window.innerWidth - 68, 16), y: Math.max(window.innerHeight - 68, 16) }
          try {
            const raw = localStorage.getItem(getFloatingCartStorageKey(nextDeviceType))
            if (!raw) {
              setFloatingPosition(fallback)
            } else {
              const parsed = JSON.parse(raw) as { x?: number; y?: number }
              if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
                setFloatingPosition({
                  x: Math.min(Math.max(parsed.x, 16), window.innerWidth - 56),
                  y: Math.min(Math.max(parsed.y, 16), window.innerHeight - 56),
                })
              } else {
                setFloatingPosition(fallback)
              }
            }
          } catch {
            setFloatingPosition(fallback)
          }
        }
        return nextDeviceType
      })
      setFloatingPosition((prev) => ({
        x: Math.min(Math.max(prev.x, 16), window.innerWidth - 56),
        y: Math.min(Math.max(prev.y, 16), window.innerHeight - 56),
      }))
    }
    window.addEventListener('resize', resizeHandler)
    return () => window.removeEventListener('resize', resizeHandler)
  }, [])

  const beginCartDrag = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointerStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: floatingPosition.x,
      originY: floatingPosition.y,
    }
    setIsDraggingCart(false)

    const onMove = (moveEvent: PointerEvent) => {
      const pointerState = pointerStateRef.current
      if (!pointerState) return
      const nextX = Math.min(Math.max(pointerState.originX + (moveEvent.clientX - pointerState.startX), 16), window.innerWidth - 56)
      const nextY = Math.min(Math.max(pointerState.originY + (moveEvent.clientY - pointerState.startY), 16), window.innerHeight - 56)
      setFloatingPosition({ x: nextX, y: nextY })

      if (!isDraggingCart) {
        const moved = Math.abs(moveEvent.clientX - pointerState.startX) + Math.abs(moveEvent.clientY - pointerState.startY) > 8
        if (moved) setIsDraggingCart(true)
      }
    }

    const onUp = () => {
      pointerStateRef.current = null
      try { event.currentTarget.releasePointerCapture(event.pointerId) } catch { /* noop */ }
      if (dragStartTimerRef.current) {
        window.clearTimeout(dragStartTimerRef.current)
        dragStartTimerRef.current = null
      }
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setTimeout(() => setIsDraggingCart(false), 0)
    }

    dragStartTimerRef.current = window.setTimeout(() => {
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      try { localStorage.setItem(DRAG_HINT_SEEN_KEY, '1') } catch { /* noop */ }
      setShowDragHint(false)
    }, 240)

    window.addEventListener('pointerup', onUp, { once: true })
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-400 ${
        scrolled
          ? 'border-[rgba(6,182,212,0.12)] bg-white/92 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-[rgba(6,6,15,0.92)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
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
                      className="focus-ring relative rounded-sm px-3 py-1.5 text-sm text-gray-500 transition-colors duration-150 hover:bg-gray-100/50 hover:text-gray-900 dark:text-[rgba(120,140,180,0.7)] dark:hover:bg-[rgba(6,182,212,0.05)] dark:hover:text-cyan-300"
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
                        `focus-ring relative rounded-sm px-3 py-1.5 text-sm transition-colors duration-150 ${
                          isActive
                            ? 'bg-[rgba(6,182,212,0.08)] font-medium text-cyan-600 dark:bg-[rgba(6,182,212,0.1)] dark:text-cyan-300'
                            : 'text-gray-500 hover:bg-gray-100/50 hover:text-gray-900 dark:text-[rgba(120,140,180,0.7)] dark:hover:bg-[rgba(6,182,212,0.05)] dark:hover:text-cyan-300'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {t(key)}
                          {isActive && (
                            <motion.span
                              layoutId="nav-indicator"
                              className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-cyan-500/80 via-cyan-400 to-cyan-500/80"
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

          <div className="ml-2 flex items-center gap-2 border-l border-[rgba(6,182,212,0.1)] dark:border-[rgba(6,182,212,0.12)] pl-3">
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
              className="block h-px w-5 bg-gray-600 dark:bg-cyan-400/70 origin-center"
            />
            <motion.span
              animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.2 }}
              className="block h-px w-5 bg-gray-600 dark:bg-cyan-400/70"
            />
            <motion.span
              animate={isOpen ? { rotate: -45, y: -9 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
              className="block h-px w-5 bg-gray-600 dark:bg-cyan-400/70 origin-center"
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
            className="overflow-hidden border-t border-[rgba(6,182,212,0.1)] md:hidden"
          >
            <nav className="bg-white/96 dark:bg-[rgba(6,6,15,0.97)] px-4 pb-6 pt-3 backdrop-blur-xl">
              {/* Cyber grid overlay */}
              <div className="cyber-grid-fine absolute inset-0 pointer-events-none opacity-40" />

              <ul className="relative flex flex-col divide-y divide-gray-50 dark:divide-[rgba(6,182,212,0.06)]">
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
                      className="group flex items-center justify-between py-3 text-sm text-gray-500 transition-colors hover:text-cyan-500 dark:text-[rgba(120,140,180,0.7)] dark:hover:text-cyan-400"
                    >
                      <span>{t(key)}</span>
                      <span className="font-mono text-[9px] text-transparent group-hover:text-cyan-500/40 transition-colors duration-200">
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
                  className="mt-4 border-t border-gray-100 dark:border-[rgba(6,182,212,0.08)] pt-4"
                >
                  <AuthButton />
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating cart ────────────────────────────────── */}
      {showFloatingCart && !pathname.startsWith(ROUTES.CART) && (
        <div className="pointer-events-none fixed z-[60]" style={{ left: floatingPosition.x, top: floatingPosition.y }}>
          <div className="pointer-events-auto relative">
            <button
              type="button"
              onClick={() => setShowFloatingCart(false)}
              aria-label={t('cart.hideFloating', { defaultValue: 'カートアイコンを閉じる' })}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-[10px] leading-none text-gray-500 shadow-sm transition hover:text-gray-800 dark:border-[rgba(6,182,212,0.2)] dark:bg-[rgba(6,6,15,0.95)] dark:text-gray-400 dark:hover:text-cyan-400"
            >
              ×
            </button>
            <Link
              to={ROUTES.CART}
              onPointerDown={beginCartDrag}
              onClick={(event) => {
                if (dragStartTimerRef.current) {
                  window.clearTimeout(dragStartTimerRef.current)
                  dragStartTimerRef.current = null
                }
                if (isDraggingCart) event.preventDefault()
              }}
              className="relative flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:scale-[1.05] hover:border-cyan-400/40 hover:text-gray-900 hover:shadow-[0_0_16px_rgba(6,182,212,0.2)] dark:border-[rgba(6,182,212,0.2)] dark:bg-[rgba(6,6,15,0.95)] dark:text-gray-300 dark:hover:border-cyan-400/50 dark:hover:text-cyan-300"
              style={{ touchAction: 'none' }}
              aria-label={t('cart.goToCart', { defaultValue: 'カートを見る' })}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path d="M3 5h2l2 11h10l2-8H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="19" r="1.5" fill="currentColor" />
                <circle cx="17" cy="19" r="1.5" fill="currentColor" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-neon-cyan px-1 text-[10px] font-bold text-cyber-950">
                  {itemCount}
                </span>
              )}
            </Link>
            {showDragHint && (
              <p className="pointer-events-none absolute -top-7 right-0 rounded-sm border border-[rgba(6,182,212,0.3)] bg-white/95 px-2 py-1 text-[10px] font-mono text-cyan-600 shadow-sm dark:border-[rgba(6,182,212,0.25)] dark:bg-[rgba(6,6,15,0.95)] dark:text-cyan-400">
                {t('cart.dragHint', { defaultValue: '長押しでドラッグ' })}
              </p>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
