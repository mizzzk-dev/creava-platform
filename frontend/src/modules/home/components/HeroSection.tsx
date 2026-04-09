import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform } from 'framer-motion'
import { fanclubLink } from '@/lib/siteLinks'
import { ROUTES } from '@/lib/routeConstants'
import { useHomeCtaAnalytics } from '@/modules/analytics/useHomeCtaAnalytics'
import { useTextScramble } from '@/hooks/useTextScramble'
import { useMagneticHover } from '@/hooks/useMagneticHover'

type AvailabilityStatus = 'available' | 'limited' | 'unavailable'
const AVAILABILITY = import.meta.env.VITE_AVAILABILITY_STATUS as AvailabilityStatus | undefined

/* ── Animated counter ───────────────────────────────── */
function Counter({ to, duration = 1600, suffix = '' }: { to: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<boolean>(false)

  useEffect(() => {
    if (ref.current) return
    ref.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setCount(Math.floor(eased * to))
      if (progress < 1) requestAnimationFrame(tick)
    }
    const id = setTimeout(() => requestAnimationFrame(tick), 600)
    return () => clearTimeout(id)
  }, [to, duration])

  return (
    <span>
      {count}
      {suffix}
    </span>
  )
}

/* ── Ticker marquee ─────────────────────────────────── */
const TICKER_ITEMS = ['film', 'photography', 'music', 'direction', 'design', 'motion', 'editorial']

function Ticker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="marquee-container border-y border-[rgba(6,182,212,0.1)] py-2 overflow-hidden">
      <div className="marquee-track flex items-center gap-8">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-8 shrink-0">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-500/60 dark:text-cyan-400/50">
              {item}
            </span>
            <span className="text-[rgba(6,182,212,0.2)] text-xs">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── System status panel ────────────────────────────── */
function SystemPanel() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000)
    return () => clearInterval(id)
  }, [])

  const rows = [
    { label: 'STATUS',   value: 'ONLINE',    color: 'text-green-400' },
    { label: 'TYPE',     value: 'CREATOR',   color: 'text-cyan-400'  },
    { label: 'MODE',     value: 'PUBLIC',    color: 'text-violet-400' },
    { label: 'BUILD',    value: `v2.${tick % 9}.${tick % 3}`, color: 'text-amber-400' },
  ]

  return (
    <div className="glass-cyber rounded-sm p-5 w-[220px] relative overflow-hidden">
      {/* Scanline sweep */}
      <div className="scanline absolute inset-0 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-400/60">
          // SYS.STATUS
        </span>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
          </span>
          <span className="font-mono text-[8px] text-green-400/70 tracking-widest">LIVE</span>
        </div>
      </div>

      {/* Data rows */}
      <div className="space-y-2.5">
        {rows.map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between group">
            <span className="font-mono text-[9px] text-[rgba(120,140,180,0.5)] tracking-widest">
              {label}
            </span>
            <span className={`font-mono text-[9px] tracking-wider ${color}`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[rgba(6,182,212,0.12)]">
        <div className="flex items-center gap-1.5">
          <span className="typed-cursor text-cyan-400/70 h-3" />
          <span className="font-mono text-[9px] text-[rgba(6,182,212,0.5)]">
            film · photo · music
          </span>
        </div>
      </div>

      {/* Corner deco */}
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-cyan-500/20" />
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyan-500/20" />
    </div>
  )
}

/* ── Stat card ──────────────────────────────────────── */
function StatCard({ value, label, accent = 'cyan' }: { value: number; label: string; accent?: 'cyan' | 'amber' | 'violet' }) {
  const colors = {
    cyan:   { border: 'border-cyan-500/20',   text: 'text-cyan-400',   bg: 'bg-cyan-500/5'   },
    amber:  { border: 'border-amber-500/20',  text: 'text-amber-400',  bg: 'bg-amber-500/5'  },
    violet: { border: 'border-violet-500/20', text: 'text-violet-400', bg: 'bg-violet-500/5' },
  }
  const c = colors[accent]

  return (
    <div className={`${c.bg} border ${c.border} px-4 py-3 rounded-sm`}>
      <div className={`font-display text-2xl font-bold ${c.text}`}>
        <Counter to={value} suffix="+" />
      </div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-[rgba(120,140,180,0.6)] mt-0.5">
        {label}
      </div>
    </div>
  )
}

/* ── Main HeroSection ───────────────────────────────── */
export default function HeroSection() {
  const { t } = useTranslation()
  const trackHomeCta = useHomeCtaAnalytics('hero')

  // Magnetic CTA refs
  const magPrimary   = useMagneticHover<HTMLAnchorElement>({ strength: 0.3, scale: 1.03 })
  const magSecondary = useMagneticHover<HTMLAnchorElement>({ strength: 0.25, scale: 1.02 })

  // Text scramble on headline
  const headline = t('home.hero.headline')
  const { text: scrambledText } = useTextScramble(headline, { duration: 900, delay: 300 })

  // Parallax on scroll
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY    = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  const stagger = {
    container: { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } },
    item: {
      hidden:  { opacity: 0, y: 24, filter: 'blur(4px)' },
      visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    },
  }

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[96vh] items-center overflow-hidden"
    >
      {/* ── Background layers ──────────────────────── */}

      {/* Cyber grid */}
      <motion.div
        className="cyber-grid pointer-events-none absolute inset-0"
        style={{ y: bgY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* Aurora glow spots */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/4 -left-1/4 h-[700px] w-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 65%)',
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)',
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.03) 0%, transparent 65%)',
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
      </div>

      {/* Bottom fade to page bg */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white dark:from-[#06060f] to-transparent" />

      {/* ── Content ─────────────────────────────────── */}
      <motion.div
        className="relative mx-auto w-full max-w-5xl px-4 py-24"
        style={{ opacity }}
      >
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_auto] md:gap-16">

          {/* Left: main content */}
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="visible"
          >
            {/* Eyebrow badges */}
            <motion.div variants={stagger.item} className="mb-8 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(120,140,180,0.7)]">
                  portfolio / v2.0
                </span>
              </div>

              {AVAILABILITY === 'available' && (
                <span className="cyber-tag flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  {t('about.availability')}
                </span>
              )}
              {AVAILABILITY === 'limited' && (
                <span className="cyber-tag-amber flex items-center gap-1.5">
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {t('about.availability')}
                </span>
              )}
            </motion.div>

            {/* Headline — scramble decode effect */}
            <motion.div variants={stagger.item}>
              <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-[68px] text-gradient-cyber">
                {scrambledText}
              </h1>
            </motion.div>

            {/* Accent rule */}
            <motion.div
              variants={stagger.item}
              className="mt-6 flex items-center gap-3"
            >
              <div className="h-px w-12 bg-gradient-to-r from-cyan-500 to-transparent" />
              <div className="h-px w-4  bg-gradient-to-r from-violet-500/50 to-transparent" />
            </motion.div>

            {/* Sub copy */}
            <motion.p
              variants={stagger.item}
              className="mt-5 max-w-lg text-lg leading-relaxed text-[rgba(120,140,180,0.85)] dark:text-[rgba(180,190,220,0.75)]"
            >
              <span className="font-mono text-sm text-cyan-500/50 select-none mr-2">&gt;</span>
              {t('home.hero.subCopy')}
            </motion.p>

            <motion.p
              variants={stagger.item}
              className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(6,182,212,0.3)]"
            >
              {t('home.hero.hubLine')}
            </motion.p>

            {/* Genre tags */}
            <motion.div
              variants={stagger.item}
              className="mt-5 flex flex-wrap gap-2"
            >
              {['film', 'photo', 'music'].map((genre) => (
                <span key={genre} className="cyber-tag">
                  {genre}
                </span>
              ))}
            </motion.div>

            {/* CTA row */}
            <motion.div
              variants={stagger.item}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Link
                ref={magPrimary.ref}
                to={`${ROUTES.CONTACT}?tab=request`}
                onClick={() => trackHomeCta('request')}
                onMouseMove={magPrimary.onMouseMove}
                onMouseLeave={magPrimary.onMouseLeave}
                className="btn-cyber-primary focus-ring group"
              >
                {t('home.hero.ctaRequest')}
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  →
                </motion.span>
              </Link>

              <Link
                ref={magSecondary.ref}
                to={ROUTES.CONTACT}
                onClick={() => trackHomeCta('contact')}
                onMouseMove={magSecondary.onMouseMove}
                onMouseLeave={magSecondary.onMouseLeave}
                className="btn-cyber-outline focus-ring"
              >
                {t('home.hero.ctaContact')}
              </Link>

              <Link
                to={ROUTES.WORKS}
                onClick={() => trackHomeCta('works')}
                className="btn-cyber-ghost focus-ring"
              >
                {t('home.hero.ctaWorks')}
              </Link>

              <Link
                to={fanclubLink(ROUTES.FANCLUB)}
                onClick={() => trackHomeCta('fanclub')}
                className="btn-cyber-ghost focus-ring"
              >
                <span className="font-mono text-[9px] text-cyan-500/40 mr-1">[ FC ]</span>
                {t('home.hero.ctaFanclub')}
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={stagger.item}
              className="mt-12 flex flex-wrap gap-3"
            >
              <StatCard value={120} label="Works"   accent="cyan"   />
              <StatCard value={50}  label="Clients" accent="amber"  />
              <StatCard value={8}   label="Years"   accent="violet" />
            </motion.div>
          </motion.div>

          {/* Right: system panel (desktop) */}
          <motion.div
            initial={{ opacity: 0, x: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="hidden self-center md:block"
          >
            <SystemPanel />
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="mt-16 flex items-center gap-3"
        >
          <motion.div
            animate={{ scaleY: [1, 0.4, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="h-5 w-px origin-top bg-gradient-to-b from-cyan-500/70 to-transparent"
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[rgba(6,182,212,0.4)]">
            scroll
          </span>
        </motion.div>
      </motion.div>

      {/* ── Ticker strip ─────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0">
        <Ticker />
      </div>
    </section>
  )
}
