import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useClerk } from '@clerk/clerk-react'
import { useCurrentUser } from '@/hooks'
import { fanclubLink } from '@/lib/siteLinks'
import { ROUTES } from '@/lib/routeConstants'
import { useHomeCtaAnalytics } from '@/modules/analytics/useHomeCtaAnalytics'
import ParticleField from '@/components/common/ParticleField'
import { SplitWords } from '@/components/common/KineticText'

const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

function BenefitsList() {
  const { t } = useTranslation()
  const benefits = [
    t('home.fanclub.benefit1'),
    t('home.fanclub.benefit2'),
    t('home.fanclub.benefit3'),
  ]

  return (
    <ul className="inline-flex flex-col gap-3 text-left">
      {benefits.map((text, i) => (
        <motion.li
          key={i}
          className="flex items-start gap-3"
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 + i * 0.08, duration: 0.45 }}
        >
          <span className="mt-1.5 flex h-3 w-3 shrink-0 items-center justify-center border border-violet-500/40">
            <span className="h-1 w-1 bg-violet-400" />
          </span>
          <span className="text-sm text-gray-300 leading-relaxed">{text}</span>
        </motion.li>
      ))}
    </ul>
  )
}

function FanclubCTALayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden bg-[#06060f] px-4 py-28 text-white">
      {/* ── Particle field ────────────────────────── */}
      <ParticleField
        count={60}
        color="139,92,246"
        lineColor="139,92,246"
        connectionDistance={130}
        repulsionRadius={80}
      />

      {/* ── Cyber grid overlay ────────────────────── */}
      <div className="cyber-grid pointer-events-none absolute inset-0 opacity-30" />

      {/* ── Aurora glow ───────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(6,182,212,0.06) 50%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 h-[400px] w-[400px] translate-y-1/4 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
      </div>

      {/* ── Top border ────────────────────────────── */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.4) 30%, rgba(6,182,212,0.4) 70%, transparent)' }}
      />

      {/* ── Bottom border ─────────────────────────── */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(6,182,212,0.2) 50%, transparent)' }}
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-[1fr_auto] md:items-center">

          {/* Left: content */}
          <div>
            {/* Member badge */}
            <motion.div
              className="mb-6 inline-flex items-center gap-2 border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 backdrop-blur-sm"
              initial={{ opacity: 0, y: -8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-50" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-violet-400/70">
                member area
              </span>
            </motion.div>

            <motion.p
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/50 mb-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              {t('home.fanclub.title')}
            </motion.p>

            <h2 className="font-display text-3xl font-bold leading-snug text-white md:text-4xl lg:text-5xl">
              <SplitWords text={t('home.fanclub.description')} staggerMs={40} />
            </h2>

            <div className="mt-8">
              <BenefitsList />
            </div>
          </div>

          {/* Right: CTA panel */}
          <motion.div
            className="flex flex-col items-start gap-4 md:items-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {children}

            {/* Decorative stats */}
            <div className="mt-4 grid grid-cols-2 gap-3 w-full">
              {[
                { label: 'members', val: '1K+', accent: 'violet' },
                { label: 'exclusives', val: '50+', accent: 'cyan' },
              ].map(({ label, val, accent }) => (
                <div
                  key={label}
                  className={`border border-${accent}-500/15 bg-${accent}-500/5 px-3 py-2 text-center`}
                >
                  <div className={`font-display text-xl font-bold text-${accent}-400`}>{val}</div>
                  <div className="font-mono text-[8px] uppercase tracking-wider opacity-40 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function FanclubCTASectionWithClerk() {
  const { t } = useTranslation()
  const { openSignIn } = useClerk()
  const { user, isLoaded, isSignedIn } = useCurrentUser()
  const trackHomeCta = useHomeCtaAnalytics('fanclub_cta')
  const isMember = user?.role === 'member' || user?.role === 'admin'

  return (
    <FanclubCTALayout>
      {!isLoaded && null}

      {isLoaded && isMember && (
        <Link
          to={fanclubLink(ROUTES.FANCLUB)}
          onClick={() => trackHomeCta('fanclub')}
          className="btn-cyber-outline group inline-flex items-center gap-2"
          style={{ borderColor: 'rgba(139,92,246,0.5)', color: 'rgba(167,139,250,0.9)' }}
        >
          {t('home.fanclub.memberButton')} →
        </Link>
      )}

      {isLoaded && !isMember && (
        !isSignedIn ? (
          <button
            onClick={() => { trackHomeCta('fanclub'); void openSignIn({}) }}
            className="btn-cyber-primary focus-ring group inline-flex items-center gap-2"
            style={{ background: 'rgba(139,92,246,0.9)', color: '#fff' }}
          >
            {t('home.fanclub.joinButton')} →
          </button>
        ) : (
          <Link
            to={fanclubLink(ROUTES.FANCLUB)}
            onClick={() => trackHomeCta('fanclub')}
            className="btn-cyber-primary focus-ring group inline-flex items-center gap-2"
            style={{ background: 'rgba(139,92,246,0.9)', color: '#fff' }}
          >
            {t('home.fanclub.joinButton')} →
          </Link>
        )
      )}
    </FanclubCTALayout>
  )
}

function FanclubCTASectionNoClerk() {
  const { t } = useTranslation()
  const trackHomeCta = useHomeCtaAnalytics('fanclub_cta')

  return (
    <FanclubCTALayout>
      <Link
        to={fanclubLink(ROUTES.FANCLUB)}
        onClick={() => trackHomeCta('fanclub')}
        className="btn-cyber-primary focus-ring group inline-flex items-center gap-2"
        style={{ background: 'rgba(139,92,246,0.9)', color: '#fff' }}
      >
        {t('home.fanclub.joinButton')} →
      </Link>
    </FanclubCTALayout>
  )
}

export default HAS_CLERK ? FanclubCTASectionWithClerk : FanclubCTASectionNoClerk
