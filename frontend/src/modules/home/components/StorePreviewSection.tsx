import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'

const PLACEHOLDER_ITEMS = [{ id: 1 }, { id: 2 }, { id: 3 }]

export default function StorePreviewSection() {
  const { t } = useTranslation()

  return (
    <motion.section
      className="bg-gray-50/60 px-4 py-20"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          {/* section label */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gray-300" />
            </span>
            <h2 className="font-mono text-xs uppercase tracking-wider text-gray-400">
              {t('home.store.title')}
            </h2>
          </div>

          <Link
            to={ROUTES.STORE}
            className="font-mono text-[10px] text-gray-300 transition-colors hover:text-gray-600"
          >
            all →
          </Link>
        </div>

        <p className="mt-2 text-sm text-gray-400">{t('home.store.description')}</p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLACEHOLDER_ITEMS.map((item) => (
            <div
              key={item.id}
              className="group flex aspect-square items-center justify-center border border-gray-100 bg-white transition-colors hover:border-gray-200"
            >
              <div className="flex flex-col items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-gray-200">
                  {t('home.store.comingSoon')}
                </span>
                <span className="font-mono text-[9px] text-gray-100">
                  item_{String(item.id).padStart(2, '0')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
