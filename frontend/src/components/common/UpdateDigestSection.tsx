import { Link } from 'react-router-dom'
import { trackCtaClick } from '@/modules/analytics/tracking'

export type UpdateTone = 'new' | 'important' | 'members' | 'early'

export interface UpdateDigestItem {
  id: string
  title: string
  description: string
  href: string
  tone: UpdateTone
  location: string
}

const TONE_STYLE: Record<UpdateTone, string> = {
  new: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  important: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
  members: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200',
  early: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
}

const TONE_LABEL: Record<UpdateTone, string> = {
  new: 'NEW',
  important: '重要',
  members: '会員限定',
  early: '先行',
}

export default function UpdateDigestSection({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: UpdateDigestItem[]
}) {
  if (items.length === 0) return null

  return (
    <section className="mt-10 rounded-3xl border border-gray-200/70 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60 sm:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">weekly digest</p>
          <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            onClick={() => trackCtaClick(item.location, 'digest_item_click', { id: item.id, tone: item.tone })}
            className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-gray-700 dark:bg-gray-950/50"
          >
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${TONE_STYLE[item.tone]}`}>{TONE_LABEL[item.tone]}</span>
            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-300">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
