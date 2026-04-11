import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ROUTES } from '@/lib/routeConstants'
import PageHead from '@/components/seo/PageHead'
import { trackCtaClick } from '@/modules/analytics/tracking'

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
    frameRef.current = setInterval(() => {
      stepRef.current++
      if (stepRef.current >= total) {
        setDisplayed(code)
        clearInterval(frameRef.current!)
        return
      }
      const progress = stepRef.current / total
      setDisplayed(
        code.split('').map((char, i) =>
          i / code.length < progress ? char : CHARS[Math.floor(Math.random() * CHARS.length)]
        ).join('')
      )
    }, 40)
    return () => clearInterval(frameRef.current!)
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
      {/* Large circle outline - top right */}
      <motion.div
        className="absolute right-[5%] top-[10%] h-48 w-48 rounded-full border border-violet-200/40 dark:border-violet-500/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      {/* Medium circle - bottom left */}
      <motion.div
        className="absolute bottom-[15%] left-[8%] h-28 w-28 rounded-full border border-cyan-200/30 dark:border-cyan-500/10"
        animate={{ rotate: -360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      />
      {/* Small dot cluster - top left */}
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
      {/* Diagonal line - right */}
      <motion.div
        className="absolute right-[15%] top-[40%] h-20 w-px bg-gradient-to-b from-transparent via-gray-300/40 dark:via-white/10 to-transparent"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Square outline - bottom right */}
      <motion.div
        className="absolute bottom-[20%] right-[10%] h-16 w-16 border border-amber-200/30 dark:border-amber-500/10"
        animate={{ rotate: [0, 45, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

/* ── Animated "lost" illustration ────────────────── */
function LostIllustration() {
  const prefersReduced = useReducedMotion()
  return (
    <motion.div
      className="relative mx-auto mb-8 h-24 w-24"
      animate={prefersReduced ? {} : { y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 96" fill="none" className="h-full w-full">
        {/* Compass body */}
        <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="1.5"
          className="text-gray-200 dark:text-white/10" />
        <circle cx="48" cy="48" r="30" stroke="currentColor" strokeWidth="1"
          className="text-gray-100 dark:text-white/5" />
        {/* Compass needle — spinning */}
        <motion.g
          animate={prefersReduced ? {} : { rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '48px', originY: '48px' }}
        >
          <path d="M48 22 L51 48 L48 58 L45 48 Z" fill="currentColor" className="text-violet-400/70 dark:text-violet-500/60" />
          <path d="M48 74 L51 48 L48 38 L45 48 Z" fill="currentColor" className="text-gray-300/70 dark:text-white/15" />
        </motion.g>
        {/* Center dot */}
        <circle cx="48" cy="48" r="3" fill="currentColor" className="text-gray-400 dark:text-white/30" />
        {/* Cardinal marks */}
        {[0, 90, 180, 270].map((deg) => (
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
    </motion.div>
  )
}

/* ── Main 404 page ──────────────────────────────── */
export default function NotFoundPage() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const prefersReduced = useReducedMotion()

  const NAV_LINKS = [
    { to: ROUTES.HOME,    label: t('common.backToHome', { defaultValue: 'ホーム' }),   icon: '⌂', desc: 'トップページ' },
    { to: ROUTES.EVENTS,  label: t('nav.events',        { defaultValue: 'イベント' }),  icon: '◈', desc: 'イベント一覧' },
    { to: ROUTES.CONTACT, label: t('nav.contact',       { defaultValue: 'お問い合わせ' }), icon: '✉', desc: '直接連絡する' },
  ]

  return (
    <section className="relative flex min-h-[84vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
      <PageHead title="404" noindex />

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(rgba(100,100,120,1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,120,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Ambient glow */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%)' }}
          animate={prefersReduced ? {} : { scale: [1, 1.12, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Corner brackets */}
        <div className="absolute left-6 top-6 h-10 w-10 border-l-2 border-t-2 border-gray-200/60 dark:border-white/[0.05]" />
        <div className="absolute right-6 top-6 h-10 w-10 border-r-2 border-t-2 border-gray-200/60 dark:border-white/[0.05]" />
        <div className="absolute bottom-6 left-6 h-10 w-10 border-b-2 border-l-2 border-gray-200/60 dark:border-white/[0.05]" />
        <div className="absolute bottom-6 right-6 h-10 w-10 border-b-2 border-r-2 border-gray-200/60 dark:border-white/[0.05]" />
      </div>

      {/* Floating shapes */}
      <FloatingShapes />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Compass illustration */}
        <LostIllustration />

        {/* Eyebrow */}
        <motion.p
          className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gray-400 dark:text-white/25"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
        >
          404 · not found
        </motion.p>

        {/* Large error code */}
        <div className="relative mb-6 inline-block select-none" aria-hidden="true">
          {/* blur ghost */}
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
          <p className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white/85">
            {t('error.404title', { defaultValue: 'ページが見つかりません' })}
          </p>
          <p className="text-sm text-gray-500 dark:text-white/40">
            {t('error.404sub', { defaultValue: 'お探しのページは移動または削除された可能性があります。' })}
          </p>
          <p className="font-mono text-[10px] text-gray-300 dark:text-white/20">
            {pathname}
          </p>
        </motion.div>

        {/* Quick nav cards */}
        <motion.div
          className="mb-8 grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          {NAV_LINKS.map(({ to, label, icon, desc }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.07, duration: 0.35 }}
              whileHover={prefersReduced ? {} : { y: -3 }}
            >
              <Link
                to={to}
                onClick={() => trackCtaClick('404_page', 'nav_click', { target: to })}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-violet-200 hover:shadow-md dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:border-violet-500/20"
              >
                <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-white/65 group-hover:text-gray-900 dark:group-hover:text-white/90 transition-colors">
                  {label}
                </span>
                <span className="hidden text-[10px] text-gray-400 dark:text-white/25 sm:block">{desc}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <Link
            to={ROUTES.HOME}
            onClick={() => trackCtaClick('404_page', 'back_home_click')}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-900 bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-700 dark:border-white/[0.10] dark:bg-white/[0.07] dark:text-white/85 dark:hover:bg-white/[0.12]"
          >
            {t('common.backToHome', { defaultValue: 'ホームへ戻る' })}
            <motion.span
              animate={prefersReduced ? {} : { x: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              →
            </motion.span>
          </Link>
          <Link
            to={ROUTES.CONTACT}
            onClick={() => trackCtaClick('404_page', 'contact_click')}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-transparent dark:text-white/60 dark:hover:border-white/[0.14]"
          >
            {t('nav.contact', { defaultValue: 'お問い合わせ' })}
          </Link>
        </motion.div>

        {/* Hint */}
        <motion.p
          className="mt-8 font-mono text-[10px] text-gray-300 dark:text-white/18"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          {t('error.404hint', { defaultValue: 'URLを確認するか、上のリンクからお探しください。' })}
        </motion.p>
      </motion.div>
    </section>
  )
}
