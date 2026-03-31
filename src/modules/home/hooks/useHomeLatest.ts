import { useStrapiCollection } from '@/hooks'
import { useContentAccess } from '@/hooks'
import { getNewsList } from '@/modules/news/api'
import { getBlogList } from '@/modules/blog/api'
import { getEventsList } from '@/modules/events/api'

export function useHomeLatest() {
  const { filterVisible } = useContentAccess()

  const news = useStrapiCollection(() =>
    getNewsList({ pagination: { pageSize: 4 } }),
  )
  const blog = useStrapiCollection(() =>
    getBlogList({ pagination: { pageSize: 4 } }),
  )
  const events = useStrapiCollection(() =>
    getEventsList({ pagination: { pageSize: 4 } }),
  )

  return {
    news: {
      items: filterVisible(news.items ?? []),
      loading: news.loading,
      error: news.error,
    },
    blog: {
      items: filterVisible(blog.items ?? []),
      loading: blog.loading,
      error: blog.error,
    },
    events: {
      items: events.items ?? [],
      loading: events.loading,
      error: events.error,
    },
  }
}
