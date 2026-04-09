import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { trackCtaClick } from '@/modules/analytics/tracking'
import { motionPresets, motionTransition } from '@/components/common/motionPresets'

interface CuratedBentoItem {
  id: string
  title: string
  description: string
  href: string
  label: string
  accent?: 'violet' | 'fuchsia' | 'sky' | 'amber'
  location: string
  action: string
  className?: string
}

interface CuratedBentoSectionProps {
  eyebrow: string
  title: string
  subtitle: string
  items: CuratedBentoItem[]
}

const ACCENT_CLASS = {
  violet: 'from-violet-100/90 to-violet-50/20 text-violet-700 dark:from-violet-950/60 dark:to-violet-950/10 dark:text-violet-200',
  fuchsia: 'from-fuchsia-100/90 to-fuchsia-50/20 text-fuchsia-700 dark:from-fuchsia-950/60 dark:to-fuchsia-950/10 dark:text-fuchsia-200',
  sky: 'from-sky-100/90 to-sky-50/20 text-sky-700 dark:from-sky-950/60 dark:to-sky-950/10 dark:text-sky-200',
  amber: 'from-amber-100/90 to-amber-50/20 text-amber-700 dark:from-amber-950/60 dark:to-amber-950/10 dark:text-amber-200',
} as const

export default function CuratedBentoSection({ eyebrow, title, subtitle, items }: CuratedBentoSectionProps) {
  const reduceMotion = useReducedMotion()

  return (
    <section className="mt-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            variants={motionPresets.sectionFadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            transition={reduceMotion ? { duration: 0 } : { ...motionTransition.base, delay: index * 0.04 }}
            className={item.className ?? 'lg:col-span-2'}
          >
            <Link
              to={item.href}
              onClick={() => trackCtaClick(item.location, item.action, { id: item.id })}
              className="group relative block h-full overflow-hidden rounded-2xl border border-gray-200/80 bg-white/85 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/75"
            >
              <div className={`absolute inset-0 bg-gradient-to-br opacity-0 transition duration-300 group-hover:opacity-100 ${ACCENT_CLASS[item.accent ?? 'violet']}`} />
              <div className="relative z-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">{item.label}</p>
                <h3 className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{item.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
