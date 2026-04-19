import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { trackCtaClick } from '@/modules/analytics/tracking'

type ExperienceSite = 'main' | 'store' | 'fanclub'

interface HighlightItem {
  id: string
  title: string
  description: string
}

interface CtaItem {
  label: string
  to: string
  style?: 'primary' | 'secondary'
}

interface Props {
  site: ExperienceSite
  title: string
  description: string
  highlights: HighlightItem[]
  ctas: CtaItem[]
}

const siteTone: Record<ExperienceSite, string> = {
  main: 'from-violet-200/70 via-sky-100/70 to-amber-100/70 dark:from-violet-500/20 dark:via-cyan-500/15 dark:to-amber-500/10',
  store: 'from-cyan-200/70 via-violet-100/60 to-sky-100/60 dark:from-cyan-500/20 dark:via-sky-500/15 dark:to-violet-500/15',
  fanclub: 'from-fuchsia-200/70 via-violet-100/70 to-cyan-100/60 dark:from-fuchsia-500/20 dark:via-violet-500/20 dark:to-cyan-500/10',
}

export default function ExperienceHighlightsSection({
  site,
  title,
  description,
  highlights,
  ctas,
}: Props) {
  const { t } = useTranslation()
  const reduced = useReducedMotion()

  return (
    <section className="mt-14">
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/90 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70 sm:p-8">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${siteTone[site]} opacity-70`} />

        <div className="relative">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
            {t('experience.eyebrow', { defaultValue: 'experience highlight' })}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600 dark:text-gray-300">{description}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {highlights.map((item, index) => (
              <motion.article
                key={item.id}
                initial={reduced ? undefined : { opacity: 0, y: 8 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: index * 0.06, duration: 0.35 }}
                className="rounded-2xl border border-gray-200/80 bg-white/85 p-4 backdrop-blur dark:border-gray-700/80 dark:bg-gray-950/60"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                <p className="mt-2 text-xs leading-6 text-gray-600 dark:text-gray-400">{item.description}</p>
              </motion.article>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {ctas.map((cta, index) => (
              <Link
                key={`${cta.to}-${index}`}
                to={cta.to}
                onClick={() => trackCtaClick(`experience_${site}`, 'cta', { target: cta.to, label: cta.label })}
                className={cta.style === 'secondary'
                  ? 'inline-flex items-center rounded-full border border-gray-300/90 bg-white/80 px-4 py-2 text-xs font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500'
                  : 'inline-flex items-center rounded-full border border-gray-900 bg-gray-900 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-gray-700 dark:border-cyan-500/70 dark:bg-cyan-500/20 dark:text-cyan-100 dark:hover:bg-cyan-500/30'}
              >
                {cta.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
