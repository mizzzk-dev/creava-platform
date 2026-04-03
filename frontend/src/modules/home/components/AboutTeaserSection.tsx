import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'

export default function AboutTeaserSection() {
  const { t } = useTranslation()

  return (
    <motion.section
      className="mx-auto max-w-5xl px-4 py-20"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
    >
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
            {t('home.about.title')}
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 md:text-3xl">
            {t('home.about.headline')}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {t('home.about.body')}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            {[
              { label: 'Film', icon: '▶' },
              { label: 'Photo', icon: '◉' },
              { label: 'Music', icon: '♩' },
            ].map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] text-gray-200 dark:text-gray-700">{icon}</span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <Link
          to={ROUTES.ABOUT}
          className="group inline-flex items-center gap-2 border border-gray-200 dark:border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:border-gray-400 dark:hover:border-gray-500 whitespace-nowrap self-end"
        >
          {t('home.about.cta')}
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </motion.section>
  )
}
