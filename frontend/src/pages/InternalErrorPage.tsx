import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import { ROUTES } from '@/lib/routeConstants'
import PageHead from '@/components/seo/PageHead'
import { trackCtaClick, trackErrorPageCta, trackErrorPageView, trackRetryClick } from '@/modules/analytics/tracking'
import { useErrorPageContent } from '@/modules/errors/useErrorPageContent'
import { getCrossSiteLinks, getErrorPageNavLinks, getSiteLabel } from '@/modules/errors/siteAwareNav'
import { isFanclubSite, isStoreSite } from '@/lib/siteLinks'

interface Props {
  code?: '500' | '503' | '403'
  onRetry?: () => void
}

/* ── Maintenance illustration (503) ────────────────── */
function MaintenanceIllustration() {
  const prefersReduced = useReducedMotion()
  return (
    <motion.div
      className="relative mx-auto mb-8 h-24 w-24"
      animate={prefersReduced ? {} : { y: [0, -5, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 96" fill="none" className="h-full w-full">
        <circle cx="48" cy="48" r="34" stroke="currentColor" strokeWidth="1.5"
          className="text-amber-200/70 dark:text-amber-400/20" />
        <circle cx="48" cy="48" r="28" stroke="currentColor" strokeWidth="1"
          className="text-amber-100/60 dark:text-amber-400/10" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
          <line
            key={i}
            x1="48" y1="18" x2="48" y2={i % 3 === 0 ? '22' : '20'}
            stroke="currentColor" strokeWidth={i % 3 === 0 ? '1.5' : '1'}
            className="text-amber-300/50 dark:text-amber-400/20"
            transform={`rotate(${deg} 48 48)`}
          />
        ))}
        <motion.line
          x1="48" y1="48" x2="48" y2="26"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          className="text-amber-500/70 dark:text-amber-400/60"
          animate={prefersReduced ? {} : { rotate: [0, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '48px', originY: '48px' }}
        />
        <motion.line
          x1="48" y1="48" x2="48" y2="20"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          className="text-amber-400/60 dark:text-amber-300/40"
          animate={prefersReduced ? {} : { rotate: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '48px', originY: '48px' }}
        />
        <circle cx="48" cy="48" r="2.5" fill="currentColor" className="text-amber-500/80 dark:text-amber-400/60" />
        <motion.g
          animate={prefersReduced ? {} : { rotate: [0, 18, 0, -14, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{ originX: '78px', originY: '78px' }}
        >
          <path d="M73 74 L83 84" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className="text-amber-300/50 dark:text-amber-400/25" />
          <circle cx="72" cy="73" r="4" stroke="currentColor" strokeWidth="1.5"
            className="text-amber-300/50 dark:text-amber-400/25" />
        </motion.g>
      </svg>
    </motion.div>
  )
}

/* ── Broken signal illustration (500) ──────────────── */
function BrokenSignalIllustration() {
  const prefersReduced = useReducedMotion()
  const arcs = [
    { r: 12, delay: 0, dim: false },
    { r: 22, delay: 0.3, dim: false },
    { r: 32, delay: 0.6, dim: true },
    { r: 42, delay: 0.9, dim: true },
  ]
  return (
    <motion.div
      className="relative mx-auto mb-8 h-24 w-24"
      animate={prefersReduced ? {} : { y: [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 96" fill="none" className="h-full w-full">
        {arcs.map(({ r, delay, dim }, i) => (
          <motion.path
            key={i}
            d={`M${48 - r * 0.7} ${56 + r * 0.1} A${r} ${r} 0 0 1 ${48 + r * 0.7} ${56 + r * 0.1}`}
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className={dim ? 'text-gray-200/40 dark:text-white/8' : 'text-gray-300/60 dark:text-white/15'}
            animate={prefersReduced ? {} : { opacity: dim ? [0.1, 0.3, 0.1] : [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay }}
          />
        ))}
        <motion.circle
          cx="48" cy="68" r="3"
          fill="currentColor" className="text-gray-400/70 dark:text-white/25"
          animate={prefersReduced ? {} : { scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as const }}
        >
          <line x1="38" y1="22" x2="58" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className="text-red-400/60 dark:text-red-400/40" />
          <line x1="58" y1="22" x2="38" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className="text-red-400/60 dark:text-red-400/40" />
        </motion.g>
      </svg>
    </motion.div>
  )
}

/* ── Lock illustration (403) ──────────────────────── */
function LockIllustration() {
  const prefersReduced = useReducedMotion()
  return (
    <motion.div
      className="relative mx-auto mb-8 h-24 w-24"
      animate={prefersReduced ? {} : { y: [0, -4, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 96" fill="none" className="h-full w-full">
        {/* Shackle */}
        <motion.path
          d="M32 46 V36 A16 16 0 0 1 64 36 V46"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className="text-violet-300/70 dark:text-violet-400/50"
          animate={prefersReduced ? {} : { y: [0, -2, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Body */}
        <rect x="26" y="46" width="44" height="32" rx="6"
          stroke="currentColor" strokeWidth="1.5" fill="currentColor"
          className="text-violet-200/40 dark:text-violet-500/10" />
        <rect x="26" y="46" width="44" height="32" rx="6"
          stroke="currentColor" strokeWidth="1.5" fill="none"
          className="text-violet-400/60 dark:text-violet-400/45" />
        {/* Keyhole */}
        <circle cx="48" cy="60" r="3.5" fill="currentColor" className="text-violet-500/70 dark:text-violet-300/60" />
        <path d="M48 63 L48 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          className="text-violet-500/70 dark:text-violet-300/60" />
        {/* Key sparkle */}
        <motion.circle
          cx="72" cy="40" r="1.8"
          fill="currentColor" className="text-amber-300/70 dark:text-amber-300/60"
          animate={prefersReduced ? {} : { opacity: [0, 1, 0], scale: [0.6, 1.4, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="24" cy="36" r="1.4"
          fill="currentColor" className="text-amber-300/60 dark:text-amber-300/45"
          animate={prefersReduced ? {} : { opacity: [0, 1, 0], scale: [0.6, 1.3, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 1.1, ease: 'easeInOut' }}
        />
      </svg>
    </motion.div>
  )
}

/* ── Pulsing dots ───────────────────────────────────── */
function SignalDots({ variant }: { variant: 'maintenance' | 'error' | 'restricted' }) {
  const dotClass = variant === 'maintenance'
    ? 'bg-amber-400 dark:bg-amber-400/70'
    : variant === 'restricted'
      ? 'bg-violet-400/70 dark:bg-violet-400/60'
      : 'bg-red-400/70 dark:bg-red-400/60'
  return (
    <div className="mb-5 flex items-center justify-center gap-1.5">
      {[0, 0.25, 0.5].map(delay => (
        <motion.span
          key={delay}
          className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`}
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export default function InternalErrorPage({ code = '500', onRetry }: Props) {
  const { t } = useTranslation()
  const prefersReduced = useReducedMotion()
  const is503 = code === '503'
  const is403 = code === '403'
  const content = useErrorPageContent(code)
  const siteLabel = getSiteLabel()
  const navLinks = getErrorPageNavLinks().slice(0, 3)
  const cross = getCrossSiteLinks()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const parallaxX = useSpring(useTransform(mouseX, [-1, 1], [-8, 8]), { stiffness: 80, damping: 18 })
  const parallaxY = useSpring(useTransform(mouseY, [-1, 1], [-8, 8]), { stiffness: 80, damping: 18 })

  useEffect(() => {
    trackErrorPageView(code, { site: siteLabel })
  }, [code, siteLabel])

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (prefersReduced) return
    const { innerWidth, innerHeight } = window
    mouseX.set((e.clientX / innerWidth - 0.5) * 2)
    mouseY.set((e.clientY / innerHeight - 0.5) * 2)
  }

  const glowColor = is503
    ? 'rgba(245,158,11,0.05)'
    : is403
      ? 'rgba(124,58,237,0.05)'
      : 'rgba(239,68,68,0.05)'

  const bracketClass = is503
    ? 'border-amber-200/40 dark:border-amber-500/10'
    : is403
      ? 'border-violet-200/40 dark:border-violet-500/10'
      : 'border-red-200/35 dark:border-red-500/10'

  const eyebrowClass = is503
    ? 'text-amber-500/60 dark:text-amber-400/50'
    : is403
      ? 'text-violet-500/70 dark:text-violet-400/50'
      : 'text-red-500/55 dark:text-red-400/45'

  const eyebrowLabel = is503 ? 'maintenance' : is403 ? 'restricted' : `error ${code}`

  const codeGhostColor = is503
    ? 'rgba(245,158,11,0.06)'
    : is403
      ? 'rgba(124,58,237,0.06)'
      : 'rgba(239,68,68,0.06)'

  const signalVariant: 'maintenance' | 'error' | 'restricted' = is503 ? 'maintenance' : is403 ? 'restricted' : 'error'

  const handleRetry = () => {
    trackCtaClick(`${code}_page`, 'retry_click', { site: siteLabel })
    trackRetryClick(`${code}_page`, { site: siteLabel })
    trackErrorPageCta(code, 'retry', { site: siteLabel })
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  const handleHome = () => {
    trackCtaClick(`${code}_page`, 'back_home_click', { site: siteLabel })
    trackErrorPageCta(code, 'home', { site: siteLabel })
  }

  const handleContact = () => {
    trackCtaClick(`${code}_page`, 'contact_click', { site: siteLabel })
    trackErrorPageCta(code, 'contact', { site: siteLabel })
  }

  return (
    <section
      className="relative flex min-h-[84vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center"
      onMouseMove={handleMouseMove}
    >
      <PageHead title={code} noindex />

      <motion.div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
        style={prefersReduced ? undefined : { x: parallaxX, y: parallaxY }}
      >
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(100,100,120,1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,120,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
          animate={prefersReduced ? {} : { scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className={`absolute left-6 top-6 h-10 w-10 border-l-2 border-t-2 ${bracketClass}`} />
        <div className={`absolute right-6 top-6 h-10 w-10 border-r-2 border-t-2 ${bracketClass}`} />
        <div className={`absolute bottom-6 left-6 h-10 w-10 border-b-2 border-l-2 ${bracketClass}`} />
        <div className={`absolute bottom-6 right-6 h-10 w-10 border-b-2 border-r-2 ${bracketClass}`} />
        {!prefersReduced && (
          <>
            <motion.div
              className={`absolute right-[8%] top-[15%] h-20 w-20 rounded-full border ${is503 ? 'border-amber-200/20 dark:border-amber-500/8' : is403 ? 'border-violet-200/18 dark:border-violet-500/8' : 'border-red-200/15 dark:border-red-500/8'}`}
              animate={{ rotate: 360 }}
              transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className={`absolute bottom-[18%] left-[6%] h-12 w-12 rounded-full border ${is503 ? 'border-amber-200/15 dark:border-amber-500/6' : is403 ? 'border-violet-200/14 dark:border-violet-500/6' : 'border-red-200/12 dark:border-red-500/6'}`}
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            />
            {/* Small drifting sparks */}
            {[
              { top: '25%', left: '35%', delay: 0.6, size: 2 },
              { top: '68%', left: '72%', delay: 1.8, size: 1.6 },
            ].map((p, i) => (
              <motion.span
                key={i}
                className={`absolute rounded-full ${is503 ? 'bg-amber-400/50 dark:bg-amber-400/35' : is403 ? 'bg-violet-400/45 dark:bg-violet-400/30' : 'bg-red-400/40 dark:bg-red-400/25'}`}
                style={{ top: p.top, left: p.left, width: p.size * 2, height: p.size * 2 }}
                animate={{ opacity: [0, 0.8, 0], y: [0, -16, -32], scale: [0.6, 1, 0.6] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeOut', delay: p.delay }}
              />
            ))}
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-xl"
      >
        {is503 ? <MaintenanceIllustration /> : is403 ? <LockIllustration /> : <BrokenSignalIllustration />}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <SignalDots variant={signalVariant} />
        </motion.div>

        <motion.p
          className={`mb-4 font-mono text-[10px] uppercase tracking-[0.28em] ${eyebrowClass}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {eyebrowLabel} · {siteLabel}
        </motion.p>

        {/* Large code */}
        <div className="relative mb-6 select-none" aria-hidden="true">
          <span
            className="pointer-events-none absolute inset-0 font-mono font-bold leading-none"
            style={{
              fontSize: 'clamp(5rem, 20vw, 10rem)',
              color: codeGhostColor,
              filter: 'blur(16px)',
            }}
          >
            {code}
          </span>
          <span
            className="relative font-mono font-bold leading-none text-gray-100 dark:text-white/[0.04]"
            style={{ fontSize: 'clamp(5rem, 20vw, 10rem)' }}
          >
            {code}
          </span>
        </div>

        {/* Message */}
        <motion.div
          className="mb-8 space-y-2.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white/85">{content.title}</p>
          <p className="text-sm leading-relaxed text-gray-500 dark:text-white/40">{content.subcopy}</p>
          {is503 && content.maintenanceBadge && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-2 dark:border-amber-500/15 dark:bg-amber-500/5">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-amber-400"
                animate={prefersReduced ? {} : { opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="font-mono text-[10px] tracking-wider text-amber-600 dark:text-amber-400/80">
                {content.maintenanceBadge}
              </span>
            </div>
          )}
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {!is403 && (
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-900 bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-700 dark:border-white/[0.10] dark:bg-white/[0.07] dark:text-white/85 dark:hover:bg-white/[0.12]"
            >
              <motion.span
                animate={prefersReduced ? {} : { rotate: [0, 360] }}
                transition={{ duration: onRetry ? 1.5 : 2, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block' }}
              >↺</motion.span>
              {onRetry
                ? t('common.retry', { defaultValue: '再試行' })
                : t('error.reload', { defaultValue: 'ページを再読み込み' })}
            </button>
          )}
          <Link
            to={ROUTES.HOME}
            onClick={handleHome}
            className={is403
              ? 'inline-flex items-center gap-2 rounded-xl border border-gray-900 bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-700 dark:border-white/[0.10] dark:bg-white/[0.07] dark:text-white/85 dark:hover:bg-white/[0.12]'
              : 'inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-transparent dark:text-white/60 dark:hover:border-white/[0.14]'}
          >
            {content.ctaHomeLabel}
            {is403 && (
              <motion.span
                animate={prefersReduced ? {} : { x: [0, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            )}
          </Link>
          <Link
            to={ROUTES.CONTACT}
            onClick={handleContact}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-transparent dark:text-white/60 dark:hover:border-white/[0.14]"
          >
            {content.ctaContactLabel}
          </Link>
        </motion.div>

        {/* Site-aware quick nav — hidden on 503 to keep focus on wait */}
        {!is503 && (
          <motion.div
            className="mt-8 grid grid-cols-3 gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.4 }}
          >
            {navLinks.map(link => (
              <Link
                key={link.id}
                to={link.to}
                onClick={() => trackErrorPageCta(code, `nav_${link.id}`, { site: siteLabel })}
                className="group flex flex-col items-center gap-1 rounded-lg border border-gray-200/70 bg-white/60 p-3 text-center transition-colors hover:border-gray-300 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.12]"
              >
                <span className="text-sm opacity-55 transition-opacity group-hover:opacity-90">{link.icon}</span>
                <span className="text-[11px] font-medium text-gray-600 dark:text-white/55">
                  {t(link.labelKey, { defaultValue: link.labelFallback })}
                </span>
              </Link>
            ))}
          </motion.div>
        )}

        {/* Cross-site discovery */}
        {(isStoreSite || isFanclubSite) && !is503 && (
          <motion.div
            className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-400 dark:text-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.95, duration: 0.4 }}
          >
            <span className="font-mono uppercase tracking-[0.22em]">
              {t('error.discover', { defaultValue: '他のサイトも見る' })}
            </span>
            <a href={cross.main} className="underline-offset-4 transition-colors hover:text-gray-700 hover:underline dark:hover:text-white/60" onClick={() => trackErrorPageCta(code, 'cross_main', { site: siteLabel })}>mizzz.jp</a>
            {!isStoreSite && (
              <a href={cross.store} className="underline-offset-4 transition-colors hover:text-gray-700 hover:underline dark:hover:text-white/60" onClick={() => trackErrorPageCta(code, 'cross_store', { site: siteLabel })}>store</a>
            )}
            {!isFanclubSite && (
              <a href={cross.fanclub} className="underline-offset-4 transition-colors hover:text-gray-700 hover:underline dark:hover:text-white/60" onClick={() => trackErrorPageCta(code, 'cross_fc', { site: siteLabel })}>fanclub</a>
            )}
          </motion.div>
        )}

        {/* Hint */}
        <motion.p
          className="mt-8 font-mono text-[10px] text-gray-300 dark:text-white/18"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          {content.hint}
        </motion.p>
      </motion.div>
    </section>
  )
}
