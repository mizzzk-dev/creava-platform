import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ROUTES } from '@/lib/routeConstants'
import PageHead from '@/components/seo/PageHead'
import { trackCtaClick } from '@/modules/analytics/tracking'

/* ── Glitch number component ─────────────────────── */
function GlitchCode({ code = '404' }: { code?: string }) {
  const prefersReduced = useReducedMotion()
  const CHARS = '!<>-_\\/[]{}—=+*^?#ABCDEFabcdef01'
  const [displayed, setDisplayed] = useState(code)
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepRef = useRef(0)

  useEffect(() => {
    if (prefersReduced) return

    const clearFrame = () => {
      if (frameRef.current) {
        clearInterval(frameRef.current)
        frameRef.current = null
      }
    }

    const total = 24
    frameRef.current = setInterval(() => {
      stepRef.current++
      if (stepRef.current >= total) {
        setDisplayed(code)
        clearFrame()
        return
      }
      const progress = stepRef.current / total
      setDisplayed(
        code
          .split('')
          .map((char, i) =>
            i / code.length < progress ? char : CHARS[Math.floor(Math.random() * CHARS.length)]
          )
          .join('')
      )
    }, 40)
    return clearFrame
  }, [code, prefersReduced])

  return (
    <span className="font-mono select-none leading-none" aria-label={code} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {displayed}
    </span>
  )
}

/* ── Main 404 page ──────────────────────────────── */
export default function NotFoundPage() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  const NAV_LINKS = [
    { to: ROUTES.HOME,    label: t('common.backToHome',   { defaultValue: 'ホーム' }),   icon: '⌂' },
    { to: ROUTES.EVENTS,  label: t('nav.events',          { defaultValue: 'イベント' }),  icon: '◈' },
    { to: ROUTES.CONTACT, label: t('nav.contact',         { defaultValue: 'お問い合わせ' }), icon: '✉' },
  ]

  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
      <PageHead title="404" noindex />

      {/* ── Ambient elements ──────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* subtle grid – light mode: very faint, dark: slightly visible */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(rgba(100,100,120,1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,120,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* corner brackets */}
        <div className="absolute left-6 top-6 h-10 w-10 border-l-2 border-t-2 border-gray-200 dark:border-cyan-500/20" />
        <div className="absolute right-6 top-6 h-10 w-10 border-r-2 border-t-2 border-gray-200 dark:border-cyan-500/20" />
        <div className="absolute bottom-6 left-6 h-10 w-10 border-b-2 border-l-2 border-gray-200 dark:border-cyan-500/20" />
        <div className="absolute bottom-6 right-6 h-10 w-10 border-b-2 border-r-2 border-gray-200 dark:border-cyan-500/20" />

        {/* ambient glow – dark mode only */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 dark:opacity-100"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* eyebrow */}
        <motion.p
          className="mb-6 font-mono text-[10px] uppercase tracking-[0.3em] text-gray-400 dark:text-cyan-500/50"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          404 · not found
        </motion.p>

        {/* ── Large 404 ── */}
        <div className="relative mb-6 inline-block select-none" aria-hidden="true">
          {/* blur ghost – light mode */}
          <span
            className="pointer-events-none absolute inset-0 font-mono font-bold leading-none dark:hidden"
            style={{
              fontSize: 'clamp(5rem, 20vw, 11rem)',
              color: 'rgba(0,0,0,0.04)',
              filter: 'blur(12px)',
            }}
          >
            404
          </span>
          {/* blur ghost – dark mode */}
          <span
            className="pointer-events-none absolute inset-0 hidden font-mono font-bold leading-none dark:block"
            style={{
              fontSize: 'clamp(5rem, 20vw, 11rem)',
              color: 'rgba(6,182,212,0.06)',
              filter: 'blur(14px)',
            }}
          >
            404
          </span>
          <span
            className="relative font-mono font-bold leading-none text-gray-100 dark:text-white/[0.04]"
            style={{ fontSize: 'clamp(5rem, 20vw, 11rem)' }}
          >
            <GlitchCode code="404" />
          </span>
        </div>

        {/* subtitle */}
        <motion.div
          className="mb-8 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {t('error.404title', { defaultValue: 'ページが見つかりません' })}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('error.404sub', { defaultValue: 'お探しのページは移動または削除された可能性があります。' })}
          </p>
          <p className="font-mono text-[10px] text-gray-300 dark:text-gray-600">
            {pathname}
          </p>
        </motion.div>

        {/* ── Quick nav cards ── */}
        <motion.div
          className="mb-8 grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          {NAV_LINKS.map(({ to, label, icon }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.06, duration: 0.3 }}
            >
              <Link
                to={to}
                onClick={() => trackCtaClick('404_page', 'nav_click', { target: to })}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-gray-700"
              >
                <span className="text-xl">{icon}</span>
                <span className="text-xs font-medium text-gray-700 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
                  {label}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* ── CTA buttons ── */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <Link
            to={ROUTES.HOME}
            onClick={() => trackCtaClick('404_page', 'back_home_click')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-900 bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
          >
            {t('common.backToHome', { defaultValue: 'ホームへ戻る' })}
            <motion.span
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              →
            </motion.span>
          </Link>
          <Link
            to={ROUTES.CONTACT}
            onClick={() => trackCtaClick('404_page', 'contact_click')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-gray-600"
          >
            {t('nav.contact', { defaultValue: 'お問い合わせ' })}
          </Link>
        </motion.div>

        {/* hint */}
        <motion.p
          className="mt-8 font-mono text-[10px] text-gray-300 dark:text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          {t('error.404hint', { defaultValue: 'URLを確認するか、上のリンクからお探しください。' })}
        </motion.p>
      </motion.div>
    </section>
  )
}
