import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/routes'

const PLACEHOLDER_ITEMS = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
]

export default function StorePreviewSection() {
  const { t } = useTranslation()

  return (
    <motion.section
      className="bg-gray-50 px-4 py-20"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs uppercase tracking-widest text-gray-400">
            {t('home.store.title')}
          </h2>
          <Link
            to={ROUTES.STORE}
            className="text-xs text-gray-400 transition-colors hover:text-gray-700"
          >
            {t('home.store.viewAll')}
          </Link>
        </div>

        <p className="mt-2 text-sm text-gray-500">{t('home.store.description')}</p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLACEHOLDER_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex aspect-square items-center justify-center bg-white"
            >
              <span className="text-xs uppercase tracking-widest text-gray-300">
                {t('home.store.comingSoon')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
