import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'

export default function ContactCTASection() {
  const { t } = useTranslation()

  return (
    <motion.section
      className="mx-auto max-w-5xl px-4 py-20 border-t border-gray-100 dark:border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
    >
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
            contact
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 md:text-3xl">
            {t('home.contact.title')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400 max-w-md">
            {t('home.contact.body')}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2">
          <Link
            to={ROUTES.CONTACT}
            className="group inline-flex items-center gap-2 bg-gray-900 dark:bg-white px-7 py-3 text-sm font-medium tracking-wide text-white dark:text-gray-900 transition-all hover:bg-gray-700 dark:hover:bg-gray-100"
          >
            {t('home.contact.cta')}
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
          <span className="font-mono text-[10px] text-gray-300 dark:text-gray-700 pl-1">
            {t('home.contact.ctaSub')}
          </span>
        </div>
      </div>
    </motion.section>
  )
}
