import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'

const SERVICES = [
  { icon: '◈', label: '映像制作', from: '¥150,000〜' },
  { icon: '◉', label: '写真撮影', from: '¥30,000〜' },
  { icon: '◎', label: '音楽制作', from: '¥15,000〜' },
  { icon: '◇', label: 'Web / Dev', from: '¥80,000〜' },
]

export default function PricingTeaserSection() {
  const { t } = useTranslation()

  return (
    <motion.section
      className="mx-auto max-w-5xl px-4 py-20 border-t border-gray-100 dark:border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
    >
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        {/* left */}
        <div className="max-w-sm">
          <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
            {t('home.pricing.subtitle')}
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 md:text-3xl">
            {t('home.pricing.title')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {t('home.pricing.body')}
          </p>
          <Link
            to={ROUTES.PRICING}
            className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:text-gray-900 dark:hover:text-gray-100"
          >
            {t('home.pricing.cta')}
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        {/* right: service cards */}
        <div className="grid grid-cols-2 gap-3 md:w-80">
          {SERVICES.map(({ icon, label, from }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="border border-gray-100 dark:border-gray-800 p-4 space-y-2 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
            >
              <span className="font-mono text-xs text-gray-200 dark:text-gray-700 select-none">
                {icon}
              </span>
              <p className="text-xs text-gray-700 dark:text-gray-300">{label}</p>
              <p className="font-mono text-sm font-medium text-gray-500 dark:text-gray-400">
                {from}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
