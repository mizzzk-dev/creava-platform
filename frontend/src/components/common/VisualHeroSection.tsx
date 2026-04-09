import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import BrandIllustration from '@/components/common/BrandIllustration'
import { trackCtaClick } from '@/modules/analytics/tracking'
import { motionPresets } from '@/components/common/motionPresets'

export interface VisualHeroAction {
  label: string
  to: string
  style?: 'primary' | 'secondary' | 'accent'
  cta: string
}

interface HeroMetric {
  label: string
  value: string
}

interface Props {
  location: string
  eyebrow: string
  badge: string
  title: string
  subtitle?: string
  description: string
  illustrationVariant?: 'store' | 'fanclub' | 'limited' | 'support'
  backgroundVariant?: 'store' | 'fanclub'
  actions: VisualHeroAction[]
  metrics?: HeroMetric[]
}

const actionStyle: Record<NonNullable<VisualHeroAction['style']>, string> = {
  primary: 'bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900',
  secondary: 'border border-gray-300 text-gray-700 hover:border-gray-500 dark:border-gray-700 dark:text-gray-200',
  accent: 'border border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
}

const bgVariantClass = {
  store: 'border-gray-200/70 bg-gradient-to-br from-white via-violet-50/60 to-white dark:border-gray-800 dark:from-gray-900 dark:via-violet-950/30 dark:to-gray-900',
  fanclub: 'border-gray-200/80 bg-gradient-to-br from-white via-fuchsia-50/60 to-white dark:border-gray-800 dark:from-gray-900 dark:via-fuchsia-950/30 dark:to-gray-900',
}

export default function VisualHeroSection({
  location,
  eyebrow,
  badge,
  title,
  subtitle,
  description,
  illustrationVariant = 'store',
  backgroundVariant = 'store',
  actions,
  metrics,
}: Props) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.header
      variants={motionPresets.heroReveal}
      initial="hidden"
      animate="visible"
      className={`overflow-hidden rounded-3xl p-6 shadow-sm shadow-gray-200/40 dark:shadow-black/20 sm:p-10 ${bgVariantClass[backgroundVariant]}`}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">{eyebrow}</p>
      <div className="mt-4 grid gap-7 lg:grid-cols-[1.25fr_1fr] lg:items-end">
        <div>
          <span className="inline-flex rounded-full border border-violet-300/70 bg-violet-100/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-violet-700 dark:border-violet-700 dark:bg-violet-900/50 dark:text-violet-200">{badge}</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">{title}
            {subtitle && <span className="mt-1 block text-gray-500 dark:text-gray-400">{subtitle}</span>}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {actions.map((action, index) => (
              <Link
                key={`${action.label}-${index}`}
                to={action.to}
                onClick={() => trackCtaClick(location, action.cta)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition hover:-translate-y-0.5 ${actionStyle[action.style ?? (index === 0 ? 'primary' : 'secondary')]}`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <motion.div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1" variants={motionPresets.illustrationFloatSoft} initial="rest" animate={reduceMotion ? 'rest' : 'animate'}>
          <BrandIllustration variant={illustrationVariant} />
          {metrics?.[0] && (
            <article className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-950/60">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">{metrics[0].label}</p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{metrics[0].value}</p>
            </article>
          )}
        </motion.div>
      </div>

      {metrics && metrics.length > 1 && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.slice(1).map((metric) => (
            <div key={`${metric.label}-${metric.value}`} className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-950/50">
              <p className="font-mono text-xs text-gray-500">{metric.label}</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{metric.value}</p>
            </div>
          ))}
        </div>
      )}
    </motion.header>
  )
}
