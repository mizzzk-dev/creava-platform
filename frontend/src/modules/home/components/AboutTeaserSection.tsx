import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import { SplitWords, ParallaxText } from '@/components/common/KineticText'

const DISCIPLINES = [
  { label: 'Film',      icon: '▶', accentClass: 'border-cyan-500/40   text-cyan-500'   },
  { label: 'Photo',     icon: '◉', accentClass: 'border-amber-500/40  text-amber-500'  },
  { label: 'Music',     icon: '♩', accentClass: 'border-violet-500/40 text-violet-500' },
  { label: 'Direction', icon: '◈', accentClass: 'border-cyan-500/30   text-cyan-400'   },
]

export default function AboutTeaserSection() {
  const { t } = useTranslation()
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['-4%', '4%'])

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-4">
      {/* ── Kinetic headline strip ─────────────────── */}
      <div className="relative overflow-hidden border-y border-[rgba(6,182,212,0.08)] py-3">
        <ParallaxText speed={4} className="opacity-[0.06] dark:opacity-[0.04]">
          {t('home.about.headline')}
        </ParallaxText>
      </div>

      {/* ── Main content ─────────────────────────── */}
      <motion.div className="mx-auto max-w-5xl px-4 py-20" style={{ y: bgY }}>
        <div className="grid grid-cols-1 gap-16 md:grid-cols-[1fr_300px]">

          {/* Left: big type + body */}
          <div>
            <motion.p
              className="section-eyebrow mb-6"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {t('home.about.title')}
            </motion.p>

            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-100 md:text-5xl">
              <SplitWords text={t('home.about.headline')} staggerMs={50} />
            </h2>

            <motion.div
              className="mt-6 flex items-center gap-2"
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="h-px w-16 bg-gradient-to-r from-cyan-500 to-violet-500" />
              <div className="h-px w-6 bg-gradient-to-r from-violet-500/50 to-transparent" />
            </motion.div>

            <motion.p
              className="mt-5 max-w-xl text-base leading-relaxed text-gray-500 dark:text-[rgba(180,190,220,0.65)]"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.25 }}
            >
              {t('home.about.body')}
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              {DISCIPLINES.map(({ label, icon, accentClass }, i) => (
                <motion.span
                  key={label}
                  className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-all duration-200 hover:opacity-100 ${accentClass}`}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 0.7, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
                  whileHover={{ opacity: 1, scale: 1.04 }}
                >
                  <span className="opacity-60 text-[8px]">{icon}</span>
                  {label}
                </motion.span>
              ))}
            </motion.div>
          </div>

          {/* Right: editorial stat sidebar */}
          <motion.div
            className="hidden flex-col justify-between md:flex"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="space-y-8">
              {[
                { num: '08', label: 'years active',  accent: 'rgba(6,182,212,0.25)',   border: 'border-cyan-500/30'   },
                { num: '120', label: 'completed',     accent: 'rgba(139,92,246,0.25)', border: 'border-violet-500/20' },
              ].map(({ num, label, accent, border }) => (
                <div key={label} className={`border-l-2 ${border} pl-5`}>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-50 mb-1">
                    // {label}
                  </p>
                  <div
                    className="font-display text-[4.5rem] font-bold leading-none text-transparent"
                    style={{ WebkitTextStroke: `1px ${accent}` }}
                  >
                    {num}
                  </div>
                </div>
              ))}
            </div>

            <Link
              to={ROUTES.ABOUT}
              className="btn-cyber-outline group mt-8 inline-flex items-center gap-2"
            >
              {t('home.about.cta')}
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            </Link>
          </motion.div>
        </div>

        {/* Mobile CTA */}
        <motion.div
          className="mt-8 md:hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Link to={ROUTES.ABOUT} className="btn-cyber-outline inline-flex items-center gap-2">
            {t('home.about.cta')} →
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}
