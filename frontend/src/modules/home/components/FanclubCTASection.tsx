import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useClerk } from '@clerk/clerk-react'
import { useCurrentUser } from '@/hooks'
import { ROUTES } from '@/lib/routeConstants'

const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

/** 共通レイアウト — ダーク背景 + member area 演出 */
function FanclubCTALayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()

  return (
    <motion.section
      className="relative overflow-hidden bg-gray-900 px-4 py-24 text-white"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* subtle dot-grid overlay */}
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.06]" />

      <div className="relative mx-auto max-w-5xl text-center">
        {/* member area label */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
            [ member area ]
          </span>
        </div>

        <h2 className="text-xs uppercase tracking-widest text-gray-500">
          {t('home.fanclub.title')}
        </h2>
        <p className="mt-4 text-2xl font-semibold md:text-3xl">
          {t('home.fanclub.description')}
        </p>

        <div className="mt-8">{children}</div>
      </div>
    </motion.section>
  )
}

function FanclubCTASectionWithClerk() {
  const { t } = useTranslation()
  const { openSignIn } = useClerk()
  const { user, isLoaded, isSignedIn } = useCurrentUser()
  const isMember = user?.role === 'member' || user?.role === 'admin'

  return (
    <FanclubCTALayout>
      {!isLoaded && null}

      {isLoaded && isMember && (
        <Link
          to={ROUTES.FANCLUB}
          className="group inline-flex items-center gap-2 border border-white/30 px-8 py-3 text-sm font-medium tracking-wide text-white transition-all duration-200 hover:border-white hover:bg-white hover:text-gray-900"
        >
          {t('home.fanclub.memberButton')}
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
      )}

      {isLoaded && !isMember && (
        !isSignedIn ? (
          <button
            onClick={() => void openSignIn({})}
            className="group inline-flex items-center gap-2 bg-white px-8 py-3 text-sm font-medium tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
          >
            {t('home.fanclub.joinButton')}
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </button>
        ) : (
          <Link
            to={ROUTES.FANCLUB}
            className="group inline-flex items-center gap-2 bg-white px-8 py-3 text-sm font-medium tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
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

  return (
    <FanclubCTALayout>
      <Link
        to={ROUTES.FANCLUB}
        className="group inline-flex items-center gap-2 bg-white px-8 py-3 text-sm font-medium tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
      >
        {t('home.fanclub.joinButton')}
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
      </Link>
    </FanclubCTALayout>
  )
}

export default HAS_CLERK ? FanclubCTASectionWithClerk : FanclubCTASectionNoClerk
