import { Link } from 'react-router-dom'
import Badge from '@/components/common/Badge'
import type { ContentStatus } from '@/types/content'

interface Props {
  title: string
  href: string
  category?: string | null
  thumbnailUrl?: string | null
  /** コレクション番号ラベル用（0 始まり） */
  index?: number
  isFeatured?: boolean
  status?: ContentStatus
}

export default function WorkCard({ title, href, category, thumbnailUrl, index, isFeatured, status }: Props) {
  const label = index !== undefined ? String(index + 1).padStart(2, '0') : null

  return (
    <Link to={href} className="group block">
      {/* image area */}
      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '1 / 1' }}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="dot-grid flex h-full w-full items-center justify-center opacity-50">
            {label && (
              <span className="font-mono text-[11px] text-gray-300 transition-colors duration-200 group-hover:text-gray-400">
                {label}
              </span>
            )}
          </div>
        )}

        {/* dark overlay on hover */}
        <div className="absolute inset-0 bg-gray-900/0 transition-colors duration-300 group-hover:bg-gray-900/[0.07]" />

        {/* index label top-left (visible on hover when thumbnail exists) */}
        {label && thumbnailUrl && (
          <span className="absolute left-2 top-2 font-mono text-[9px] text-white/0 transition-colors duration-200 group-hover:text-white/60">
            {label}
          </span>
        )}

        {/* badges — top-right */}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {isFeatured && (
            <Badge variant="featured" />
          )}
          {status === 'fc_only' && (
            <Badge variant="fc" />
          )}
          {status === 'limited' && (
            <Badge variant="limited" />
          )}
        </div>
      </div>

      {/* meta */}
      <div className="mt-2.5 space-y-0.5">
        {category && (
          <span className="block font-mono text-[10px] uppercase tracking-wider text-gray-400 transition-colors duration-150 group-hover:text-gray-500">
            {category}
          </span>
        )}
        <h3 className="text-sm font-medium leading-snug text-gray-900 transition-colors duration-150 group-hover:text-gray-500">
          {title}
        </h3>
      </div>
    </Link>
  )
}
