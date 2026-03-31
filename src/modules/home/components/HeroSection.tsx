import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'

export default function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="flex min-h-[85vh] items-center px-4">
      <div className="mx-auto w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <h1 className="text-5xl font-semibold leading-tight tracking-tight text-gray-900 md:text-7xl">
            {t('home.hero.headline')}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-gray-500">
            {t('home.hero.subCopy')}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to={ROUTES.WORKS}
              className="inline-flex items-center bg-gray-900 px-6 py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-gray-700"
            >
              {t('home.hero.ctaWorks')}
            </Link>
            <Link
              to={ROUTES.CONTACT}
              className="inline-flex items-center border border-gray-300 px-6 py-3 text-sm font-medium tracking-wide text-gray-700 transition-colors hover:border-gray-500"
            >
              {t('home.hero.ctaContact')}
            </Link>
            <Link
              to={ROUTES.FANCLUB}
              className="inline-flex items-center px-6 py-3 text-sm font-medium tracking-wide text-gray-500 transition-colors hover:text-gray-900"
            >
              {t('home.hero.ctaFanclub')} →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
