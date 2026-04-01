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
    <Link to={href} className="group block border-t border-gray-100 py-4">
      {tag && (
        <span className="text-xs uppercase tracking-widest text-gray-400">
          {tag}
        </span>
      )}
      <h3 className="mt-1 text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-500 line-clamp-2">
        {title}
      </h3>
      {publishAt && (
        <p className="mt-1 text-xs text-gray-400">{formatDate(publishAt)}</p>
      )}
    </Link>
  )
}
