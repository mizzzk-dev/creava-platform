import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import { useHomeCtaAnalytics } from '@/modules/analytics/useHomeCtaAnalytics'
import { SplitWords } from '@/components/common/KineticText'

export default function ContactCTASection() {
  const { t } = useTranslation()
  const trackHomeCta = useHomeCtaAnalytics('contact_cta')
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const bgX = useTransform(scrollYProgress, [0, 1], ['-3%', '3%'])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-[rgba(6,182,212,0.08)]"
    >
      {/* ── Animated bg grid ──────────────────────── */}
      <div className="cyber-grid pointer-events-none absolute inset-0 opacity-40" />

      {/* ── Glow spots ────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-1/4 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full"
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            x: bgX,
            background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
          }}
        />
        <motion.div
          className="absolute -right-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full"
          animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Content ───────────────────────────────── */}
      <div className="relative mx-auto max-w-5xl px-4 py-24 md:py-32">
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">

          {/* Left: headline */}
          <div className="max-w-xl">
            <motion.p
              className="section-eyebrow mb-5"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              contact
            </motion.p>

            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-100 md:text-5xl lg:text-6xl">
              <SplitWords text={t('home.contact.title')} staggerMs={45} />
            </h2>

            <motion.p
              className="mt-5 max-w-md text-base leading-relaxed text-gray-500 dark:text-[rgba(180,190,220,0.65)]"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {t('home.contact.body')}
            </motion.p>
          </div>

          {/* Right: CTA block */}
          <motion.div
            className="flex shrink-0 flex-col items-start gap-3"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              to={ROUTES.CONTACT}
              onClick={() => trackHomeCta('contact')}
              className="btn-cyber-primary group inline-flex items-center gap-2.5 focus-ring"
            >
              {t('home.contact.cta')}
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            </Link>

            <Link
              to={`${ROUTES.CONTACT}?tab=request`}
              onClick={() => trackHomeCta('request')}
              className="btn-cyber-ghost inline-flex items-center gap-2 text-xs"
            >
              <span className="font-mono text-[9px] text-cyan-500/40">[ RFP ]</span>
              {t('home.hero.ctaRequest')}
            </Link>

            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[rgba(6,182,212,0.3)] pl-0.5">
              {t('home.contact.ctaSub')}
            </span>
          </motion.div>
        </div>

        {/* Bottom accent line */}
        <motion.div
          className="mt-16 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(6,182,212,0.3) 30%, rgba(139,92,246,0.3) 70%, transparent)',
          }}
          initial={{ scaleX: 0, originX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </section>
  )
}
