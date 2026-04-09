import { Link } from 'react-router-dom'
import { trackCtaClick } from '@/modules/analytics/tracking'
import SectionReveal from '@/components/common/SectionReveal'

export interface EditorialSpotlightItem {
  id: string
  eyebrow: string
  title: string
  description: string
  href: string
  ctaLabel: string
  tone?: 'default' | 'campaign' | 'member'
  trackingLocation: string
}

const TONE_CLASS: Record<NonNullable<EditorialSpotlightItem['tone']>, string> = {
  default: 'border-gray-200 bg-white/85 dark:border-gray-800 dark:bg-gray-900/70',
  campaign: 'border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20',
  member: 'border-violet-200 bg-violet-50/70 dark:border-violet-900/60 dark:bg-violet-950/20',
}

export default function EditorialSpotlightSection({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: EditorialSpotlightItem[]
}) {
  if (items.length === 0) return null

  return (
    <SectionReveal className="mt-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">curated spotlight</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{title}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Link
            key={item.id}
            to={item.href}
            onClick={() => trackCtaClick(item.trackingLocation, 'spotlight_click', { id: item.id, tone: item.tone ?? 'default' })}
            className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${TONE_CLASS[item.tone ?? 'default']} ${index === 0 ? 'lg:col-span-2' : ''}`}
          >
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-white/70 blur-2xl dark:bg-white/10" aria-hidden />
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">{item.eyebrow}</p>
            <h3 className="mt-2 text-lg font-semibold leading-tight text-gray-900 transition-colors group-hover:text-gray-600 dark:text-gray-100 dark:group-hover:text-gray-300">{item.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{item.description}</p>
            <span className="mt-5 inline-flex w-fit rounded-full border border-current/30 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200">
              {item.ctaLabel} →
            </span>
          </Link>
        ))}
      </div>
    </SectionReveal>
  )
}
