import { Link } from 'react-router-dom'
import { formatDate } from '@/utils'

interface Props {
  title: string
  href: string
  publishAt?: string | null
  tag?: string
}

export default function ContentCard({ title, href, publishAt, tag }: Props) {
  return (
    <Link
      to={href}
      className="group block border-t border-gray-100 py-4 transition-all duration-150 hover:border-gray-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {tag && (
            <span className="inline-block rounded-sm bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-400 ring-1 ring-inset ring-gray-100">
              {tag}
            </span>
          )}
          <h3 className="mt-1.5 line-clamp-2 text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-500">
            {title}
          </h3>
        </div>

        {/* arrow — slides in on hover */}
        <span className="mt-1.5 shrink-0 text-sm text-gray-200 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-gray-400">
          →
        </span>
      </div>

      {publishAt && (
        <p className="mt-1.5 font-mono text-[11px] text-gray-300">
          {formatDate(publishAt)}
        </p>
      )}
    </Link>
  )
}
