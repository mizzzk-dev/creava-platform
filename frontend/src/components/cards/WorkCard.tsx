import { Link } from 'react-router-dom'

interface Props {
  title: string
  href: string
  category?: string | null
  thumbnailUrl?: string | null
}

export default function WorkCard({ title, href, category, thumbnailUrl }: Props) {
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
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-[10px] text-gray-300">no image</span>
          </div>
        )}

        {/* overlay on hover — collection feel */}
        <div className="absolute inset-0 bg-gray-900/0 transition-colors duration-300 group-hover:bg-gray-900/10" />
      </div>

      {/* meta */}
      <div className="mt-3 space-y-1">
        {category && (
          <span className="inline-block font-mono text-[10px] uppercase tracking-wider text-gray-400">
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
