import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import { storeLink } from '@/lib/siteLinks'

const BENEFITS = [
  { icon: '✦', labelKey: 'fanclub.benefit.exclusive', color: 'text-violet-500 dark:text-violet-400' },
  { icon: '◈', labelKey: 'fanclub.benefit.earlyAccess', color: 'text-cyan-600 dark:text-cyan-400' },
  { icon: '⊹', labelKey: 'fanclub.benefit.storeDiscount', color: 'text-amber-600 dark:text-amber-400' },
  { icon: '❋', labelKey: 'fanclub.benefit.qanda', color: 'text-violet-500 dark:text-violet-400' },
] as const

export default function FanclubHeroSection() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden fc-hero-surface">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(167,139,250,0.28),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.14),transparent_55%)]" />
      <div className="cyber-grid pointer-events-none absolute inset-0 opacity-[0.06]" />

      {/* subtle orb motion (軽量) */}
      {!reduceMotion && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 2.4, ease: 'easeOut' }}
          className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl"
        />
      )}

      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-200">
              members only
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[56px]">
            {t('nav.fanclub')}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-violet-100/80">
            {t('fanclub.pageLead', {
              defaultValue: '今週の更新・限定公開・会員向け導線をまとめて確認できます。',
            })}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to={ROUTES.MEMBER}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              {t('nav.member', { defaultValue: 'マイページ' })}
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              to={storeLink(ROUTES.STORE)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm text-violet-100 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/15"
            >
              {t('nav.store')} →
            </Link>
            <Link
              to={ROUTES.NEWS}
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-violet-200/70 transition-colors hover:text-violet-100"
            >
              {t('fanclub.heroNewsCta', { defaultValue: '新着ニュース' })} →
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {BENEFITS.map(({ icon, labelKey, color }) => (
            <div
              key={labelKey}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/8"
            >
              <span className={`text-xl ${color}`}>{icon}</span>
              <p className="mt-2 text-xs leading-relaxed text-violet-100/80">
                {t(labelKey, { defaultValue: labelKey.split('.').pop() ?? '' })}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
