import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform, AnimatePresence, useReducedMotion } from 'framer-motion'
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
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setCount(Math.floor(eased * to))
      if (progress < 1) requestAnimationFrame(tick)
    }
    const id = setTimeout(() => requestAnimationFrame(tick), 600)
    return () => clearTimeout(id)
  }, [to, duration])

  return <span>{count}{suffix}</span>
}

/* ── Ticker marquee ─────────────────────────────────── */
const TICKER_ITEMS = ['film', 'photography', 'music', 'direction', 'design', 'motion', 'editorial']

function Ticker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="marquee-container border-y border-gray-200/60 py-2.5 overflow-hidden dark:border-white/[0.05]">
      <div className="marquee-track flex items-center gap-10">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-10 shrink-0">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400 dark:text-white/25">
              {item}
            </span>
            <span className="text-gray-200 text-[8px] dark:text-white/10">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Brand Visual Accent (replaces SystemPanel) ────── */
const DISCIPLINES = ['FILM', 'PHOTO', 'MUSIC', 'MOTION', 'EDIT', 'BRAND']

function BrandVisualAccent() {
  const prefersReduced = useReducedMotion()
  const [activeIdx, setActiveIdx] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (prefersReduced) return
    const id = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setActiveIdx(i => (i + 1) % DISCIPLINES.length)
        setIsVisible(true)
      }, 280)
    }, 2200)
    return () => clearInterval(id)
  }, [prefersReduced])

  return (
    <div className="relative w-[220px] select-none" aria-hidden="true">
      {/* Main card */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] dark:border-white/[0.07] dark:bg-[rgba(14,14,28,0.90)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.6)]">

        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-gray-100/80 dark:border-white/[0.06] px-4 py-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-400 dark:text-white/30">
            creative
          </span>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[8px] text-emerald-500 dark:text-emerald-400/70 tracking-widest">active</span>
          </div>
        </div>

        {/* Discipline word — cycling */}
        <div className="flex items-center justify-center py-8 px-4">
          <AnimatePresence mode="wait">
            {isVisible && (
              <motion.span
                key={activeIdx}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-[2.4rem] font-black tracking-tight text-gray-900 dark:text-white/85"
              >
                {DISCIPLINES[activeIdx]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Discipline dots */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {DISCIPLINES.map((_, i) => (
            <motion.span
              key={i}
              animate={{ opacity: i === activeIdx ? 1 : 0.2, scale: i === activeIdx ? 1.2 : 1 }}
              transition={{ duration: 0.3 }}
              className="h-1 w-1 rounded-full bg-violet-400 dark:bg-violet-500"
            />
          ))}
        </div>

        {/* Bottom: discipline list */}
        <div className="border-t border-gray-100/80 dark:border-white/[0.06] px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {['film', 'photo', 'music'].map((d, i) => (
              <motion.span
                key={d}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="rounded-md border border-gray-100 dark:border-white/[0.08] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-gray-400 dark:text-white/30"
              >
                {d}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Subtle gradient overlay — editorial feel */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-50/30 via-transparent to-cyan-50/20 dark:from-violet-900/10 dark:to-transparent" />
      </div>

      {/* Floating accent circles */}
      <motion.div
        animate={prefersReduced ? {} : { y: [0, -6, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-3 -right-3 h-14 w-14 rounded-full border border-violet-200/60 dark:border-violet-500/15"
      />
      <motion.div
        animate={prefersReduced ? {} : { y: [0, 5, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="absolute -bottom-4 -left-4 h-10 w-10 rounded-full border border-cyan-200/50 dark:border-cyan-500/10"
      />
    </div>
  )
}

/* ── Stat card ──────────────────────────────────────── */
function StatCard({ value, label, suffix = '+' }: { value: number; label: string; suffix?: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-l border-gray-200 dark:border-white/[0.08] pl-4 first:border-0 first:pl-0">
      <div className="font-display text-2xl font-bold text-gray-900 dark:text-white/85">
        <Counter to={value} suffix={suffix} />
      </div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 dark:text-white/30">
        {label}
      </div>
    </div>
  )
}

/* ── Main HeroSection ───────────────────────────────── */
export default function HeroSection() {
  const { t } = useTranslation()
  const trackHomeCta = useHomeCtaAnalytics('hero')
  const prefersReduced = useReducedMotion()

  const magPrimary   = useMagneticHover<HTMLAnchorElement>({ strength: 0.3, scale: 1.03 })
  const magSecondary = useMagneticHover<HTMLAnchorElement>({ strength: 0.25, scale: 1.02 })

  const headline = t('home.hero.headline')
  const { text: scrambledText } = useTextScramble(headline, { duration: 900, delay: 300 })

  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY     = useTransform(scrollYProgress, [0, 1], ['0%', '28%'])
  const opacity  = useTransform(scrollYProgress, [0, 0.65], [1, 0])

  const stagger = {
    container: { hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } } },
    item: {
      hidden:  { opacity: 0, y: 20, filter: 'blur(4px)' },
      visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    },
  }

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[96vh] items-center overflow-hidden"
    >
      {/* ── Background layers ──────────────────────── */}

      {/* Subtle grid */}
      <motion.div
        className="cyber-grid pointer-events-none absolute inset-0"
        style={{ y: bgY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.8 }}
      />

      {/* Soft ambient glow — editorial, not neon */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/3 -left-1/4 h-[600px] w-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 65%)' }}
          animate={prefersReduced ? {} : { scale: [1, 1.07, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(8,145,178,0.05) 0%, transparent 65%)' }}
          animate={prefersReduced ? {} : { scale: [1, 1.09, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
        />
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white dark:from-[#06060f] to-transparent" />

      {/* ── Content ─────────────────────────────────── */}
      <motion.div
        className="relative mx-auto w-full max-w-5xl px-4 py-20 md:py-28"
        style={{ opacity }}
      >
        <div className="grid grid-cols-1 gap-14 md:grid-cols-[1fr_auto] md:items-center md:gap-16">

          {/* Left: main content */}
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="visible"
          >
            {/* Eyebrow */}
            <motion.div variants={stagger.item} className="mb-8 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400 dark:text-white/30">
                  mizzz · portfolio
                </span>
              </div>

              {AVAILABILITY === 'available' && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 dark:border-emerald-500/20 dark:bg-emerald-500/8">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {t('about.availability')}
                  </span>
                </span>
              )}
              {AVAILABILITY === 'limited' && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200/80 bg-amber-50/80 px-2.5 py-1 dark:border-amber-500/20 dark:bg-amber-500/8">
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {t('about.availability')}
                  </span>
                </span>
              )}
            </motion.div>

            {/* Headline */}
            <motion.div variants={stagger.item}>
              <h1 className="font-display text-5xl font-black leading-[1.04] tracking-tight text-gray-900 dark:text-white/90 md:text-[66px]">
                {scrambledText}
              </h1>
            </motion.div>

            {/* Accent rule */}
            <motion.div variants={stagger.item} className="mt-6 flex items-center gap-3">
              <motion.div
                className="h-px w-14 origin-left bg-gradient-to-r from-violet-500 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.div
                className="h-px w-5 origin-left bg-gradient-to-r from-cyan-400/50 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.0, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.div>

            {/* Sub copy */}
            <motion.p
              variants={stagger.item}
              className="mt-5 max-w-lg text-lg leading-relaxed text-gray-500 dark:text-white/50"
            >
              {t('home.hero.subCopy')}
            </motion.p>
            <motion.p
              variants={stagger.item}
              className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-300 dark:text-white/20"
            >
              {t('home.hero.hubLine')}
            </motion.p>

            {/* Genre tags */}
            <motion.div variants={stagger.item} className="mt-5 flex flex-wrap gap-2">
              {['film', 'photo', 'music'].map((genre) => (
                <span
                  key={genre}
                  className="rounded-md border border-gray-200 bg-white/80 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/35"
                >
                  {genre}
                </span>
              ))}
            </motion.div>

            {/* CTA row */}
            <motion.div variants={stagger.item} className="mt-10 flex flex-wrap items-center gap-3">
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
                  animate={prefersReduced ? {} : { x: [0, 3, 0] }}
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
                <span className="mr-1 font-mono text-[9px] text-gray-300 dark:text-white/20">FC</span>
                {t('home.hero.ctaFanclub')}
              </Link>
            </motion.div>

            {/* Stats row — editorial style */}
            <motion.div variants={stagger.item} className="mt-12 flex flex-wrap items-center gap-0">
              <StatCard value={120} label="Works" />
              <StatCard value={50}  label="Clients" />
              <StatCard value={8}   label="Years" />
            </motion.div>
          </motion.div>

          {/* Right: brand visual accent (desktop) */}
          <motion.div
            initial={{ opacity: 0, x: 24, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="hidden self-center md:block"
          >
            <BrandVisualAccent />
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="mt-16 flex items-center gap-3"
        >
          <motion.div
            animate={prefersReduced ? {} : { scaleY: [1, 0.35, 1] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
            className="h-5 w-px origin-top bg-gradient-to-b from-gray-400/50 dark:from-white/30 to-transparent"
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-gray-300 dark:text-white/20">
            scroll
          </span>
        </motion.div>
      </motion.div>

      {/* ── Ticker ─────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0">
        <Ticker />
      </div>
    </section>
  )
}
