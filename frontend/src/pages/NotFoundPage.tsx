import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ROUTES } from '@/lib/routeConstants'
import PageHead from '@/components/seo/PageHead'
import { trackCtaClick, trackErrorPageCta, trackErrorPageView, trackPlayfulInteraction } from '@/modules/analytics/tracking'
import { useErrorPageContent } from '@/modules/errors/useErrorPageContent'
import { getCrossSiteLinks, getErrorPageNavLinks, getSiteLabel } from '@/modules/errors/siteAwareNav'
import { isFanclubSite, isStoreSite } from '@/lib/siteLinks'

/* ── Glitch number ────────────────────────────────── */
function GlitchCode({ code = '404' }: { code?: string }) {
  const prefersReduced = useReducedMotion()
  const CHARS = '!<>-_\\/[]{}—=+*^?#ABCDEFabcdef01'
  const [displayed, setDisplayed] = useState(code)
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepRef = useRef(0)

  useEffect(() => {
    if (prefersReduced) return
    const total = 24
    stepRef.current = 0
    frameRef.current = setInterval(() => {
      stepRef.current++
      if (stepRef.current >= total) {
        setDisplayed(code)
        if (frameRef.current) clearInterval(frameRef.current)
        return
      }
      const progress = stepRef.current / total
      setDisplayed(
        code.split('').map((char, i) =>
          i / code.length < progress ? char : CHARS[Math.floor(Math.random() * CHARS.length)],
        ).join(''),
      )
    }, 40)
    return () => {
      if (frameRef.current) clearInterval(frameRef.current)
    }
  }, [code, prefersReduced])

  return (
    <span className="font-mono select-none leading-none" aria-label={code} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {displayed}
    </span>
  )
}

/* ── Floating geometric shapes (illustration) ────── */
function FloatingShapes() {
  const prefersReduced = useReducedMotion()
  if (prefersReduced) return null
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute right-[5%] top-[10%] h-48 w-48 rounded-full border border-violet-200/40 dark:border-violet-500/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-[15%] left-[8%] h-28 w-28 rounded-full border border-cyan-200/30 dark:border-cyan-500/10"
        animate={{ rotate: -360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute left-[12%] top-[25%]"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {[0, 1, 2].map(i => (
          <span key={i} className="absolute h-1.5 w-1.5 rounded-full bg-violet-300/40 dark:bg-violet-500/20"
            style={{ top: `${i * 10}px`, left: `${i * 8}px` }}
          />
        ))}
      </motion.div>
      <motion.div
        className="absolute right-[15%] top-[40%] h-20 w-px bg-gradient-to-b from-transparent via-gray-300/40 dark:via-white/10 to-transparent"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[20%] right-[10%] h-16 w-16 border border-amber-200/30 dark:border-amber-500/10"
        animate={{ rotate: [0, 45, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Small floating sparks */}
      {[
        { top: '18%', left: '38%', delay: 0.4, size: 2 },
        { top: '62%', left: '68%', delay: 1.2, size: 1.5 },
        { top: '48%', left: '18%', delay: 2.0, size: 2.5 },
      ].map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-violet-400/50 dark:bg-violet-400/35"
          style={{ top: p.top, left: p.left, width: p.size * 2, height: p.size * 2 }}
          animate={{ opacity: [0, 0.9, 0], y: [0, -18, -36], scale: [0.6, 1, 0.6] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeOut', delay: p.delay }}
        />
      ))}
    </div>
  )
}

/* ── Animated "lost compass" illustration ────────── */
function LostIllustration({ onTap }: { onTap?: () => void }) {
  const prefersReduced = useReducedMotion()
  const [boost, setBoost] = useState(0)

  const handleTap = () => {
    if (!prefersReduced) setBoost(v => v + 1)
    onTap?.()
  }

  return (
    <motion.button
      type="button"
      onClick={handleTap}
      className="group relative mx-auto mb-8 block h-24 w-24 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
      aria-label="compass"
      animate={prefersReduced ? {} : { y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={prefersReduced ? undefined : { scale: 1.04 }}
      whileTap={prefersReduced ? undefined : { scale: 0.96 }}
    >
      <svg viewBox="0 0 96 96" fill="none" className="h-full w-full">
        <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="1.5"
          className="text-gray-200 dark:text-white/10" />
        <circle cx="48" cy="48" r="30" stroke="currentColor" strokeWidth="1"
          className="text-gray-100 dark:text-white/5" />
        {/* Outer halo on hover */}
        <motion.circle
          cx="48" cy="48" r="40"
          stroke="currentColor" strokeWidth="0.8"
          className="text-violet-400/0 group-hover:text-violet-400/40 transition-colors"
          animate={prefersReduced ? {} : { opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.g
          key={boost}
          animate={prefersReduced ? {} : { rotate: [0, boost ? 720 : 360] }}
          transition={{ duration: boost ? 2.2 : 8, repeat: boost ? 0 : Infinity, ease: boost ? [0.22, 1, 0.36, 1] : 'easeInOut' }}
          style={{ originX: '48px', originY: '48px' }}
        >
          <path d="M48 22 L51 48 L48 58 L45 48 Z" fill="currentColor" className="text-violet-400/70 dark:text-violet-500/60" />
          <path d="M48 74 L51 48 L48 38 L45 48 Z" fill="currentColor" className="text-gray-300/70 dark:text-white/15" />
        </motion.g>
        <circle cx="48" cy="48" r="3" fill="currentColor" className="text-gray-400 dark:text-white/30" />
        {[0, 90, 180, 270].map(deg => (
          <text
            key={deg}
            x="48"
            y="16"
            textAnchor="middle"
            fontSize="7"
            fill="currentColor"
            className="text-gray-300 dark:text-white/20 font-mono"
            transform={`rotate(${deg} 48 48)`}
          >
            {['N', 'E', 'S', 'W'][deg / 90]}
          </text>
        ))}
      </svg>
    </motion.button>
  )
}

/* ── Main 404 page ──────────────────────────────── */
export default function NotFoundPage() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const prefersReduced = useReducedMotion()
  const content = useErrorPageContent('404')
  const navLinks = getErrorPageNavLinks()
  const siteLabel = getSiteLabel()
  const cross = getCrossSiteLinks()

  // Parallax — subtle mouse-follow for the illustration layer
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const parallaxX = useSpring(useTransform(mouseX, [-1, 1], [-10, 10]), { stiffness: 80, damping: 18 })
  const parallaxY = useSpring(useTransform(mouseY, [-1, 1], [-10, 10]), { stiffness: 80, damping: 18 })

  useEffect(() => {
    trackErrorPageView('404', { site: siteLabel, pathname })
  }, [siteLabel, pathname])

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (prefersReduced) return
    const { innerWidth, innerHeight } = window
    mouseX.set((e.clientX / innerWidth - 0.5) * 2)
    mouseY.set((e.clientY / innerHeight - 0.5) * 2)
  }

  const handlePrimaryHome = () => {
    trackCtaClick('404_page', 'back_home_click', { site: siteLabel })
    trackErrorPageCta('404', 'home', { site: siteLabel })
  }
  const handleContact = () => {
    trackCtaClick('404_page', 'contact_click', { site: siteLabel })
    trackErrorPageCta('404', 'contact', { site: siteLabel })
  }

  return (
    <section
      className="relative flex min-h-[84vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center"
      onMouseMove={handleMouseMove}
    >
      <PageHead title="404" noindex />

      {/* Ambient background */}
      <motion.div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
        style={prefersReduced ? undefined : { x: parallaxX, y: parallaxY }}
      >
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(rgba(100,100,120,1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,120,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%)' }}
          animate={prefersReduced ? {} : { scale: [1, 1.12, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute left-6 top-6 h-10 w-10 border-l-2 border-t-2 border-gray-200/60 dark:border-white/[0.05]" />
        <div className="absolute right-6 top-6 h-10 w-10 border-r-2 border-t-2 border-gray-200/60 dark:border-white/[0.05]" />
        <div className="absolute bottom-6 left-6 h-10 w-10 border-b-2 border-l-2 border-gray-200/60 dark:border-white/[0.05]" />
        <div className="absolute bottom-6 right-6 h-10 w-10 border-b-2 border-r-2 border-gray-200/60 dark:border-white/[0.05]" />
      </motion.div>

      <FloatingShapes />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-xl"
      >
        <LostIllustration onTap={() => trackPlayfulInteraction('compass_spin', '404_page', { site: siteLabel })} />

        <motion.p
          className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gray-400 dark:text-white/25"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
        >
          404 · {siteLabel} · not found
        </motion.p>

        {/* Large error code */}
        <div className="relative mb-6 inline-block select-none" aria-hidden="true">
          <span
            className="pointer-events-none absolute inset-0 font-mono font-bold leading-none"
            style={{
              fontSize: 'clamp(5rem, 20vw, 10rem)',
              color: 'rgba(124,58,237,0.05)',
              filter: 'blur(16px)',
            }}
          >
            404
          </span>
          <span
            className="relative font-mono font-bold leading-none text-gray-100 dark:text-white/[0.04]"
            style={{ fontSize: 'clamp(5rem, 20vw, 10rem)' }}
          >
            <GlitchCode code="404" />
          </span>
        </div>

        {/* Message */}
        <motion.div
          className="mb-8 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white/85">{content.title}</p>
          <p className="text-sm text-gray-500 dark:text-white/40">{content.subcopy}</p>
          <p className="break-all font-mono text-[10px] text-gray-300 dark:text-white/20">{pathname}</p>
        </motion.div>

        {/* Quick nav cards — site aware */}
        <motion.div
          className={`mb-8 grid gap-3 ${navLinks.length > 3 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          {navLinks.map((link, i) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.07, duration: 0.35 }}
              whileHover={prefersReduced ? {} : { y: -3 }}
            >
              <Link
                to={link.to}
                onClick={() => {
                  trackCtaClick('404_page', 'nav_click', { target: link.to, site: siteLabel })
                  trackErrorPageCta('404', `nav_${link.id}`, { site: siteLabel })
                }}
                className="group flex h-full flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-violet-200 hover:shadow-md dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:border-violet-500/20"
              >
                <span className="text-lg opacity-60 transition-opacity group-hover:opacity-100">{link.icon}</span>
                <span className="text-xs font-medium text-gray-700 transition-colors group-hover:text-gray-900 dark:text-white/65 dark:group-hover:text-white/90">
                  {t(link.labelKey, { defaultValue: link.labelFallback })}
                </span>
                <span className="hidden text-[10px] text-gray-400 dark:text-white/25 sm:block">
                  {t(link.descKey, { defaultValue: link.descFallback })}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Primary CTAs */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <Link
            to={ROUTES.HOME}
            onClick={handlePrimaryHome}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-900 bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-700 dark:border-white/[0.10] dark:bg-white/[0.07] dark:text-white/85 dark:hover:bg-white/[0.12]"
          >
            {content.ctaHomeLabel}
            <motion.span
              animate={prefersReduced ? {} : { x: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              →
            </motion.span>
          </Link>
          <Link
            to={ROUTES.CONTACT}
            onClick={handleContact}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-transparent dark:text-white/60 dark:hover:border-white/[0.14]"
          >
            {content.ctaContactLabel}
          </Link>
        </motion.div>

        {/* Cross-site discovery — helps回遊 */}
        {(isStoreSite || isFanclubSite) && (
          <motion.div
            className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-400 dark:text-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.95, duration: 0.4 }}
          >
            <span className="font-mono uppercase tracking-[0.22em]">
              {t('error.discover', { defaultValue: '他のサイトも見る' })}
            </span>
            <a
              href={cross.main}
              onClick={() => trackErrorPageCta('404', 'cross_main', { site: siteLabel })}
              className="underline-offset-4 transition-colors hover:text-gray-700 hover:underline dark:hover:text-white/60"
            >
              mizzz.jp
            </a>
            {!isStoreSite && (
              <a
                href={cross.store}
                onClick={() => trackErrorPageCta('404', 'cross_store', { site: siteLabel })}
                className="underline-offset-4 transition-colors hover:text-gray-700 hover:underline dark:hover:text-white/60"
              >
                store
              </a>
            )}
            {!isFanclubSite && (
              <a
                href={cross.fanclub}
                onClick={() => trackErrorPageCta('404', 'cross_fc', { site: siteLabel })}
                className="underline-offset-4 transition-colors hover:text-gray-700 hover:underline dark:hover:text-white/60"
              >
                fanclub
              </a>
            )}
          </motion.div>
        )}

        {/* Hint */}
        <motion.p
          className="mt-8 font-mono text-[10px] text-gray-300 dark:text-white/18"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          {content.hint}
        </motion.p>
      </motion.div>
    </section>
  )
}
