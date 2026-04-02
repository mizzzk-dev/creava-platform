import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'

export default function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden px-4">
      {/* dot-grid background */}
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.28]" />

      {/* subtle top-right radial highlight */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/4 rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        }}
      />

      {/* bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent" />

      <div className="relative mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-[1fr_auto]">
          {/* left: main content */}
          <div>
            {/* system status badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-8 flex items-center gap-2"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-gray-400">
                portfolio / v2.0
              </span>
            </motion.div>

            {/* headline */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut', delay: 0.08 }}
            >
              <h1 className="text-gradient text-5xl font-semibold leading-[1.1] tracking-tight md:text-[72px]">
                {t('home.hero.headline')}
              </h1>

              {/* accent line */}
              <div className="mt-6 h-px w-16 bg-gradient-to-r from-gray-300 to-transparent" />

              {/* sub copy */}
              <p className="mt-5 flex max-w-lg items-start gap-2 text-lg leading-relaxed text-gray-500">
                <span className="mt-0.5 font-mono text-sm leading-7 text-gray-300 select-none">&gt;</span>
                <span>{t('home.hero.subCopy')}</span>
              </p>

              {/* genre tags */}
              <div className="mt-5 flex flex-wrap gap-2">
                {['film', 'photo', 'music'].map((genre) => (
                  <span
                    key={genre}
                    className="rounded-sm border border-gray-100 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-gray-400"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* CTA row */}
              <div className="mt-10 flex flex-wrap items-center gap-3">
                {/* primary */}
                <Link
                  to={ROUTES.WORKS}
                  className="group inline-flex items-center gap-2 bg-gray-900 px-7 py-3 text-sm font-medium tracking-wide text-white transition-all duration-200 hover:bg-gray-700"
                >
                  {t('home.hero.ctaWorks')}
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </Link>

                {/* secondary */}
                <Link
                  to={ROUTES.CONTACT}
                  className="inline-flex items-center border border-gray-200 px-7 py-3 text-sm font-medium tracking-wide text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50"
                >
                  {t('home.hero.ctaContact')}
                </Link>

                {/* fanclub — tertiary */}
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

          {/* right: decorative system panel (desktop only) */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="hidden self-center md:block"
          >
            <div className="w-52 rounded-sm border border-gray-100 bg-white/80 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest text-gray-300">
                  // system
                </span>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'status', value: 'online' },
                  { label: 'type', value: 'creator' },
                  { label: 'mode', value: 'public' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-gray-300">{label}</span>
                    <span className="font-mono text-[10px] text-gray-500">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-gray-50 pt-2.5">
                <span className="font-mono text-[9px] text-gray-200">film · photo · music</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-16 flex items-center gap-2"
        >
          <div className="h-4 w-px bg-gray-200" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-gray-300">scroll</span>
        </motion.div>
      </div>
    </section>
  )
}
