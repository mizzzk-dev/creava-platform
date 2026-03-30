import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSlugDetail } from '@/hooks'
import { getNewsDetail } from '@/modules/news/api'
import ContentAccessGuard from '@/components/guards/ContentAccessGuard'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import { formatDate } from '@/utils'
import { ROUTES } from '@/lib/routes'
import type { NewsItem } from '@/types'

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const { item, loading, error, notFound } = useSlugDetail<NewsItem>(getNewsDetail, slug)

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      {loading && <p className="text-sm text-gray-400">{t('common.loading')}</p>}
      {error && <ErrorState message={error} />}
      {notFound && <NotFoundState backTo={ROUTES.NEWS} />}

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
