import { Link } from 'react-router-dom'

interface SeoInternalLinkItem {
  href: string
  title: string
  description: string
}

interface Props {
  title: string
  description: string
  items: SeoInternalLinkItem[]
}

export default function SeoInternalLinkSection({ title, description, items }: Props) {
  if (items.length === 0) return null

  return (
    <section aria-label={title} className="mt-12 rounded-2xl border border-gray-200/80 bg-white/80 p-5 sm:p-6 dark:border-gray-800 dark:bg-gray-900/60">
      <p className="section-eyebrow">CONTENT HUB</p>
      <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={`${item.href}-${item.title}`}
            to={item.href}
            className="rounded-xl border border-gray-200/70 bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-950/60 dark:hover:border-gray-600"
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
