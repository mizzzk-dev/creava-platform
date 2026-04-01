import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'

export default function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden px-4">
      {/* subtle dot-grid background */}
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.35]" />

      <div className="relative mx-auto w-full max-w-5xl">
        {/* system status label */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center gap-2"
        >
          {/* live ping dot */}
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-gray-400">
            portfolio / v2.0
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
        >
          <h1 className="text-5xl font-semibold leading-tight tracking-tight text-gray-900 md:text-7xl">
            {t('home.hero.headline')}
          </h1>

          <p className="mt-6 flex max-w-xl items-start gap-2 text-lg text-gray-500">
            <span className="font-mono text-sm leading-7 text-gray-300 select-none">&gt;</span>
            <span>{t('home.hero.subCopy')}</span>
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            {/* primary CTA */}
            <Link
              to={ROUTES.WORKS}
              className="group inline-flex items-center gap-2 bg-gray-900 px-6 py-3 text-sm font-medium tracking-wide text-white transition-all duration-200 hover:bg-gray-700"
            >
              {t('home.hero.ctaWorks')}
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </Link>

            {/* secondary CTA */}
            <Link
              to={ROUTES.CONTACT}
              className="inline-flex items-center border border-gray-200 px-6 py-3 text-sm font-medium tracking-wide text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50"
            >
              {t('home.hero.ctaContact')}
            </Link>

            {/* tertiary CTA — fanclub, subtle */}
            <Link
              to={ROUTES.FANCLUB}
              className="inline-flex items-center gap-1.5 px-4 py-3 text-sm tracking-wide text-gray-400 transition-colors duration-200 hover:text-gray-900"
            >
              <span className="font-mono text-[10px] text-gray-300">[ FC ]</span>
              {t('home.hero.ctaFanclub')}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
