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
      className="group block border-t border-gray-100 py-3.5 transition-colors duration-150 hover:border-gray-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* tag + status badges */}
          {(tag || status === 'fc_only' || status === 'limited') && (
            <div className="mb-1.5 flex flex-wrap items-center gap-1">
              {tag && (
                <span className="inline-block rounded-sm border border-gray-100 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                  {tag}
                </span>
              )}
              {status === 'fc_only' && <Badge variant="fc" />}
              {status === 'limited' && <Badge variant="limited" />}
            </div>
          )}

          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 transition-colors duration-150 group-hover:text-gray-500">
            {title}
          </h3>

          {venue && (
            <p className="mt-1 font-mono text-[11px] text-gray-300 line-clamp-1">
              @ {venue}
            </p>
          )}
        </div>

        {/* arrow — slides right on hover */}
        <span className="mt-0.5 shrink-0 text-sm text-gray-200 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-gray-400">
          →
        </span>
      </div>

      {dateStr && (
        <p className="mt-1.5 font-mono text-[11px] text-gray-300">
          {formatDate(dateStr)}
        </p>
      )}
    </Link>
  )
}
