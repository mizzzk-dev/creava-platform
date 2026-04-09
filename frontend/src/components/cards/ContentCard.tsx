import { Link } from 'react-router-dom'
import { formatDate } from '@/utils'
import Badge from '@/components/common/Badge'
import type { ContentStatus } from '@/types/content'

interface Props {
  title: string
  href: string
  publishAt?: string | null
  tag?: string
  status?: ContentStatus
  /** Events: start date */
  startAt?: string | null
  /** Events: venue */
  venue?: string | null
}

export default function ContentCard({ title, href, publishAt, tag, status, startAt, venue }: Props) {
  const dateStr = startAt ?? publishAt

  return (
    <Link
      to={href}
      className="group block border-t border-[rgba(6,182,212,0.08)] py-3.5 transition-colors duration-200 hover:border-[rgba(6,182,212,0.2)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* tag + status badges */}
          {(tag || status === 'fc_only' || status === 'limited') && (
            <div className="mb-2 flex flex-wrap items-center gap-1">
              {tag && (
                <span className="cyber-tag">{tag}</span>
              )}
              {status === 'fc_only' && <Badge variant="fc" />}
              {status === 'limited' && <Badge variant="limited" />}
            </div>
          )}

          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-700 dark:text-[rgba(220,225,240,0.8)] transition-colors duration-200 group-hover:text-cyan-400">
            {title}
          </h3>

          {venue && (
            <p className="mt-1 font-mono text-[10px] text-[rgba(6,182,212,0.4)] line-clamp-1">
              @ {venue}
            </p>
          )}
        </div>

        {/* arrow */}
        <span className="mt-0.5 shrink-0 font-mono text-sm text-[rgba(6,182,212,0.2)] transition-all duration-200 group-hover:translate-x-1 group-hover:text-cyan-400">
          →
        </span>
      </div>

      {dateStr && (
        <p className="mt-1.5 font-mono text-[10px] text-[rgba(6,182,212,0.3)]">
          {formatDate(dateStr)}
        </p>
      )}

      {/* animated underline */}
      <div className="mt-1.5 h-px w-0 bg-gradient-to-r from-cyan-500/40 to-transparent transition-all duration-400 ease-out group-hover:w-full" />
    </Link>
  )
}
