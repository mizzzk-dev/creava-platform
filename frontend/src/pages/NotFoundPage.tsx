import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import PageHead from '@/components/seo/PageHead'

/** Floating particles (purely decorative) */
function Stars() {
  const dots = [
    { x: '15%', y: '20%', size: 1, delay: 0 },
    { x: '75%', y: '15%', size: 1.5, delay: 0.3 },
    { x: '40%', y: '70%', size: 1, delay: 0.6 },
    { x: '85%', y: '55%', size: 2, delay: 0.2 },
    { x: '8%',  y: '60%', size: 1, delay: 0.8 },
    { x: '60%', y: '35%', size: 1.5, delay: 0.4 },
    { x: '25%', y: '45%', size: 1, delay: 1.0 },
    { x: '92%', y: '30%', size: 1, delay: 0.5 },
  ]

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {dots.map((d, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gray-200 dark:bg-gray-700"
          style={{ left: d.x, top: d.y, width: d.size, height: d.size }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.4, 1] }}
          transition={{ duration: 3, delay: d.delay, repeat: Infinity, repeatType: 'reverse' }}
        />
      ))}
    </div>
  )
}

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-40 text-center overflow-hidden">
      <PageHead title="404" noindex />
      <Stars />

      {/* dot-grid bg */}
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.15]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative space-y-5"
      >
        {/* large 404 */}
        <div className="relative inline-block">
          <span className="font-mono text-[120px] font-bold leading-none text-gray-100 dark:text-gray-800 select-none">
            404
          </span>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[120px] font-bold leading-none text-gray-200 dark:text-gray-700 select-none blur-sm">
            404
          </span>
        </div>

        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
            lost in space
          </p>
          <p className="text-base text-gray-600 dark:text-gray-400">
            {t('error.404sub')}
          </p>
          <p className="font-mono text-xs text-gray-400 dark:text-gray-600">
            {t('error.404hint')}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 pt-4">
          <Link
            to={ROUTES.HOME}
            className="group inline-flex items-center gap-2 bg-gray-900 dark:bg-white px-7 py-3 text-sm font-medium text-white dark:text-gray-900 transition-all hover:bg-gray-700 dark:hover:bg-gray-100"
          >
            {t('common.backToHome')}
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            to={ROUTES.WORKS}
            className="font-mono text-[11px] text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-400 transition-colors"
          >
            or browse works
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
