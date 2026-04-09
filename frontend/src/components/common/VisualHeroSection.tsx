import { motion, useReducedMotion } from 'framer-motion'
import BrandIllustration from '@/components/common/BrandIllustration'
import { trackCtaClick } from '@/modules/analytics/tracking'
import { motionPresets } from '@/components/common/motionPresets'
import Button from '@/components/common/ui/Button'
import SemanticBadge from '@/components/common/ui/SemanticBadge'
import { useSeasonalTheme } from '@/modules/seasonal/context'

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
  seasonalTitle?: string
  actions: VisualHeroAction[]
  metrics?: HeroMetric[]
}

const bgVariantClass = {
  store: 'border-gray-200/70 bg-gradient-to-br from-white via-violet-50/60 to-white dark:border-gray-800 dark:from-gray-900 dark:via-violet-950/30 dark:to-gray-900',
  fanclub: 'border-gray-200/80 bg-gradient-to-br from-white via-fuchsia-50/60 to-white dark:border-gray-800 dark:from-gray-900 dark:via-fuchsia-950/30 dark:to-gray-900',
} as const

const seasonalOverlayClass = {
  default: '',
  christmas: 'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.15),transparent_40%)]',
  halloween: 'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.16),transparent_40%)]',
  newyear: 'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_43%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.12),transparent_38%)]',
} as const

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
  seasonalTitle,
}: Props) {
  const reduceMotion = useReducedMotion()
  const { resolution } = useSeasonalTheme()

  return (
    <motion.header
      variants={motionPresets.heroReveal}
      initial="hidden"
      animate="visible"
      className={`relative overflow-hidden rounded-3xl p-6 shadow-sm shadow-gray-200/40 dark:shadow-black/20 sm:p-10 ${bgVariantClass[backgroundVariant]} ${seasonalOverlayClass[resolution.theme]}`}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">{eyebrow}</p>
      {seasonalTitle ? <p className="mt-2 inline-flex rounded-full border border-current/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-300">{seasonalTitle}</p> : null}
      <div className="mt-4 grid gap-7 lg:grid-cols-[1.25fr_1fr] lg:items-end">
        <div>
          <SemanticBadge tone={backgroundVariant === 'fanclub' ? 'members' : 'featured'}>{badge}</SemanticBadge>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">{title}
            {subtitle && <span className="mt-1 block text-gray-500 dark:text-gray-400">{subtitle}</span>}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {actions.map((action, index) => (
              <Button
                key={`${action.label}-${index}`}
                to={action.to}
                variant={action.style ?? (index === 0 ? 'primary' : 'secondary')}
                onClick={() => trackCtaClick(location, action.cta)}
              >
                {action.label}
              </Button>
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
