import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useClerk } from '@clerk/clerk-react'
import { useCurrentUser } from '@/hooks'
import { ROUTES } from '@/lib/routeConstants'
import { useHomeCtaAnalytics } from '@/modules/analytics/useHomeCtaAnalytics'

const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

/** Benefits list — items sourced from i18n */
function BenefitsList() {
  const { t } = useTranslation()
  const benefits = [
    t('home.fanclub.benefit1'),
    t('home.fanclub.benefit2'),
    t('home.fanclub.benefit3'),
  ]

  return (
    <ul className="mb-8 inline-flex flex-col gap-2 text-left">
      {benefits.map((text, i) => (
        <li key={i} className="flex items-center gap-2.5">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10">
            <span className="h-1 w-1 rounded-full bg-violet-400" />
          </span>
          <span className="text-sm text-gray-300">{text}</span>
        </li>
      ))}
    </ul>
  )
}

/** Shared dark layout */
function FanclubCTALayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()

  return (
    <motion.section
      className="relative overflow-hidden bg-gray-950 px-4 py-28 text-white"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* dot-grid overlay */}
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.05]" />

      {/* ambient violet glow */}
      <div className="ambient-violet pointer-events-none absolute inset-0" />

      {/* top thin border */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <div className="relative mx-auto max-w-5xl text-center">
        {/* member area badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
            member area
          </span>
        </div>

        <h2 className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
          {t('home.fanclub.title')}
        </h2>
        <p className="mt-4 text-2xl font-semibold leading-snug md:text-3xl">
          {t('home.fanclub.description')}
        </p>

        {/* benefits list */}
        <div className="mt-8 flex justify-center">
          <BenefitsList />
        </div>

        {children}
      </div>
    </motion.section>
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
          to={ROUTES.FANCLUB}
          onClick={() => trackHomeCta('fanclub')}
          className="focus-ring group inline-flex items-center gap-2 border border-white/20 px-8 py-3 text-sm font-medium tracking-wide text-white transition-all duration-200 hover:border-violet-400/60 hover:bg-violet-500/10"
        >
          {t('home.fanclub.memberButton')}
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
      )}

      {isLoaded && !isMember && (
        !isSignedIn ? (
          <button
            onClick={() => {
              trackHomeCta('fanclub')
              void openSignIn({})
            }}
            className="focus-ring group inline-flex items-center gap-2 bg-white px-8 py-3 text-sm font-medium tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
          >
            {t('home.fanclub.joinButton')}
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </button>
        ) : (
          <Link
            to={ROUTES.FANCLUB}
            onClick={() => trackHomeCta('fanclub')}
            className="focus-ring group inline-flex items-center gap-2 bg-white px-8 py-3 text-sm font-medium tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
          >
            {t('home.fanclub.joinButton')}
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
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
        to={ROUTES.FANCLUB}
        onClick={() => trackHomeCta('fanclub')}
        className="focus-ring group inline-flex items-center gap-2 bg-white px-8 py-3 text-sm font-medium tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
      >
        {t('home.fanclub.joinButton')}
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
      </Link>
    </FanclubCTALayout>
  )
}

export default HAS_CLERK ? FanclubCTASectionWithClerk : FanclubCTASectionNoClerk
