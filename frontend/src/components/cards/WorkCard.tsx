import { Link } from 'react-router-dom'

interface Props {
  title: string
  href: string
  category?: string | null
  thumbnailUrl?: string | null
  /** コレクション番号ラベル用（0 始まり） */
  index?: number
}

export default function WorkCard({ title, href, category, thumbnailUrl, index }: Props) {
  const label = index !== undefined ? String(index + 1).padStart(2, '0') : null

  return (
    <Link to={href} className="group block">
      {/* image area */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="dot-grid flex h-full w-full items-center justify-center opacity-60">
            {label && (
              <span className="font-mono text-[11px] text-gray-300">{label}</span>
            )}
          </div>
        )}

        {/* overlay on hover */}
        <div className="absolute inset-0 bg-gray-900/0 transition-colors duration-300 group-hover:bg-gray-900/8" />

        {/* index label — top-left on hover */}
        {label && thumbnailUrl && (
          <span className="absolute left-2 top-2 font-mono text-[9px] text-white/0 transition-colors duration-200 group-hover:text-white/60">
            {label}
          </span>
        )}
      </div>

      {/* meta */}
      <div className="mt-3 space-y-0.5">
        {category && (
          <span className="block font-mono text-[10px] uppercase tracking-wider text-gray-400">
            {category}
          </span>
        )}
        <h3 className="text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-500">
          {title}
        </h3>
      </div>
    </Link>
  )
}
