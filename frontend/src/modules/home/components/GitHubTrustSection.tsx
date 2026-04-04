import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import GitHubActivityCard from '@/components/common/GitHubActivityCard'
import { ROUTES } from '@/lib/routeConstants'

export default function GitHubTrustSection() {
  const { t } = useTranslation()

  return (
    <motion.section
      className="mx-auto max-w-5xl px-4 py-20 border-t border-gray-100 dark:border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_320px] md:items-start">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
            {t('home.github.label')}
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 md:text-3xl">
            {t('home.github.title')}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {t('home.github.body')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={ROUTES.ABOUT}
              className="inline-flex items-center border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:border-gray-400 dark:hover:border-gray-500"
            >
              {t('about.ctaWorks')}
            </Link>
            <Link
              to={ROUTES.CONTACT}
              className="inline-flex items-center border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:border-gray-400 dark:hover:border-gray-500"
            >
              {t('home.hero.ctaContact')}
            </Link>
          </div>
        </div>

        <GitHubActivityCard />
      </div>
    </motion.section>
  )
}
