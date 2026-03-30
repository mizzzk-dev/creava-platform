import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSlugDetail } from '@/hooks'
import { getBlogDetail } from '@/modules/blog/api'
import ContentAccessGuard from '@/components/guards/ContentAccessGuard'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import { formatDate } from '@/utils'
import { ROUTES } from '@/lib/routes'
import type { BlogPost } from '@/types'

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const { item, loading, error, notFound } = useSlugDetail<BlogPost>(getBlogDetail, slug)

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      {loading && <p className="text-sm text-gray-400">{t('common.loading')}</p>}
      {error && <ErrorState message={error} />}
      {notFound && <NotFoundState backTo={ROUTES.BLOG} />}

      {item && (
        <ContentAccessGuard item={item}>
          <article className="max-w-3xl">
            <header>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                {item.title}
              </h1>
              {item.publishAt && (
                <p className="mt-2 text-sm text-gray-400">{formatDate(item.publishAt)}</p>
              )}
              {item.tags && item.tags.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </header>

            {item.body && (
              <div className="mt-8 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {item.body}
              </div>
            )}
          </article>
        </ContentAccessGuard>
      )}
    </section>
  )
}
