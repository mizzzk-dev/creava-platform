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
      <div className="aspect-square overflow-hidden bg-gray-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs text-gray-300">No image</span>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        {category && (
          <p className="text-xs uppercase tracking-widest text-gray-400">
            {category}
          </p>
        )}
        <h3 className="text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-500">
          {title}
        </h3>
      </div>
    </Link>
  )
}
