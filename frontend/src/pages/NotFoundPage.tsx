import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ROUTES } from '@/lib/routeConstants'
import PageHead from '@/components/seo/PageHead'

/* ── Glitch 404 heading ─────────────────────────── */
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
        code
          .split('')
          .map((char, i) =>
            i / code.length < progress ? char : CHARS[Math.floor(Math.random() * CHARS.length)]
          )
          .join('')
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

/* ── Main page ─────────────────────────────────── */
export default function NotFoundPage() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  const NAV_LINKS = [
    { to: ROUTES.HOME,    label: 'cd ~',       cmd: 'home'    },
    { to: ROUTES.WORKS,   label: 'ls works/',  cmd: 'works'   },
    { to: ROUTES.CONTACT, label: 'mail -s',    cmd: 'contact' },
    { to: ROUTES.STORE,   label: 'open store', cmd: 'store'   },
  ]

  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
      <PageHead title="404" noindex />

      {/* cyber grid */}
      <div className="cyber-grid pointer-events-none absolute inset-0 opacity-30" />

      {/* ambient glow */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* corner marks */}
      <div className="pointer-events-none absolute left-6 top-6 h-10 w-10 border-l border-t border-cyan-500/20" />
      <div className="pointer-events-none absolute right-6 top-6 h-10 w-10 border-r border-t border-cyan-500/20" />
      <div className="pointer-events-none absolute bottom-6 left-6 h-10 w-10 border-b border-l border-cyan-500/20" />
      <div className="pointer-events-none absolute bottom-6 right-6 h-10 w-10 border-b border-r border-cyan-500/20" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* eyebrow */}
        <motion.p
          className="section-eyebrow mb-6"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          error.status
        </motion.p>

        {/* big 404 */}
        <div className="relative mb-4 inline-block">
          <span
            className="pointer-events-none absolute inset-0 font-mono font-bold leading-none select-none"
            style={{ fontSize: 'clamp(6rem, 22vw, 14rem)', color: 'rgba(6,182,212,0.08)', filter: 'blur(16px)' }}
            aria-hidden="true"
          >
            404
          </span>
          <span
            className="pointer-events-none absolute inset-0 font-mono font-bold leading-none select-none"
            style={{ fontSize: 'clamp(6rem, 22vw, 14rem)', color: 'rgba(139,92,246,0.05)', filter: 'blur(2px)', transform: 'translate(-2px, -1px)' }}
            aria-hidden="true"
          >
            404
          </span>
          <span
            className="relative font-mono font-bold leading-none text-[rgba(6,6,15,0.06)] dark:text-[rgba(255,255,255,0.04)] select-none"
            style={{ fontSize: 'clamp(6rem, 22vw, 14rem)' }}
          >
            <GlitchCode code="404" />
          </span>
        </div>

        {/* subtitle */}
        <motion.div
          className="mb-8 space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-500/50">
            signal_lost — resource_not_found
          </p>
          <p className="text-sm text-gray-500 dark:text-[rgba(180,190,220,0.55)]">
            {t('error.404sub')}
          </p>
        </motion.div>

        {/* terminal block */}
        <motion.div
          className="glass-cyber overflow-hidden text-left"
          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.45, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* chrome */}
          <div className="flex items-center gap-1.5 border-b border-[rgba(6,182,212,0.1)] px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-red-400/50" />
            <span className="h-2 w-2 rounded-full bg-amber-400/50" />
            <span className="h-2 w-2 rounded-full bg-cyan-500/50" />
            <span className="ml-3 font-mono text-[9px] uppercase tracking-widest text-cyan-500/30">
              mizzz — bash — 80×24
            </span>
          </div>

          {/* body */}
          <div className="space-y-1.5 px-5 py-4">
            <p className="font-mono text-[11px] text-cyan-400/70">
              <span className="text-[rgba(6,182,212,0.4)]">$</span>{' '}
              <span className="text-gray-300/60">locate</span>{' '}
              <span className="text-amber-400/60">{pathname}</span>
            </p>
            <p className="font-mono text-[11px] text-red-400/70">
              locate: {pathname}: No such file or directory
            </p>
            <p className="font-mono text-[11px] text-[rgba(6,182,212,0.3)]">
              exit code 127 — resource unreachable
            </p>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[rgba(6,182,212,0.25)]">
              // available routes
            </p>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {NAV_LINKS.map(({ to, label, cmd }, i) => (
                <motion.div
                  key={to}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.07, duration: 0.3 }}
                >
                  <Link
                    to={to}
                    className="group inline-flex items-center gap-1.5 font-mono text-[10px] text-cyan-400/60 transition-colors hover:text-cyan-300"
                  >
                    <span className="text-[rgba(6,182,212,0.25)] transition-colors group-hover:text-cyan-500/50">›</span>
                    {label}
                    <span className="text-[rgba(6,182,212,0.2)] group-hover:text-cyan-500/30">// {cmd}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* hint */}
        <motion.p
          className="mt-4 font-mono text-[10px] text-[rgba(6,182,212,0.25)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          {t('error.404hint')}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.45 }}
        >
          <Link to={ROUTES.HOME} className="btn-cyber-primary focus-ring inline-flex items-center gap-2">
            {t('common.backToHome')}
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              →
            </motion.span>
          </Link>
          <Link to={ROUTES.CONTACT} className="btn-cyber-ghost focus-ring inline-flex items-center gap-2 text-xs">
            <span className="font-mono text-[9px] text-cyan-500/40">[ ? ]</span>
            {t('nav.contact')}
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}
