import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useClerk } from '@clerk/clerk-react'
import { useCurrentUser } from '@/hooks'
import { ROUTES } from '@/lib/routeConstants'

const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

function FanclubCTASectionWithClerk() {
  const { t } = useTranslation()
  const { openSignIn } = useClerk()
  const { user, isLoaded, isSignedIn } = useCurrentUser()

  const isMember = user?.role === 'member' || user?.role === 'admin'

  return (
    <motion.section
      className="bg-gray-900 px-4 py-24 text-white"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-xs uppercase tracking-widest text-gray-400">
          {t('home.fanclub.title')}
        </h2>
        <p className="mt-4 text-2xl font-semibold md:text-3xl">
          {t('home.fanclub.description')}
        </p>

        <div className="mt-8">
          {!isLoaded && null}

          {isLoaded && isMember && (
            <Link
              to={ROUTES.FANCLUB}
              className="inline-flex items-center border border-white px-8 py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-white hover:text-gray-900"
            >
              {t('home.fanclub.memberButton')}
            </Link>
          )}

          {isLoaded && !isMember && (
            <div className="flex flex-col items-center gap-4">
              {!isSignedIn ? (
                <button
                  onClick={() => void openSignIn({})}
                  className="inline-flex items-center bg-white px-8 py-3 text-sm font-medium tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
                >
                  {t('home.fanclub.joinButton')}
                </button>
              ) : (
                <Link
                  to={ROUTES.FANCLUB}
                  className="inline-flex items-center bg-white px-8 py-3 text-sm font-medium tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
                >
                  {t('home.fanclub.joinButton')}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}

function FanclubCTASectionNoClerk() {
  const { t } = useTranslation()

  return (
    <motion.section
      className="bg-gray-900 px-4 py-24 text-white"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-xs uppercase tracking-widest text-gray-400">
          {t('home.fanclub.title')}
        </h2>
        <p className="mt-4 text-2xl font-semibold md:text-3xl">
          {t('home.fanclub.description')}
        </p>
        <div className="mt-8">
          <Link
            to={ROUTES.FANCLUB}
            className="inline-flex items-center bg-white px-8 py-3 text-sm font-medium tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
          >
            {t('home.fanclub.joinButton')}
          </Link>
        </div>
      </div>
    </motion.section>
  )
}

export default HAS_CLERK ? FanclubCTASectionWithClerk : FanclubCTASectionNoClerk
