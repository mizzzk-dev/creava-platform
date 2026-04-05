import { ROUTES } from '@/lib/routeConstants'

const routePrefetchers = {
  [ROUTES.NEWS]: () => Promise.all([import('@/pages/NewsPage'), import('@/modules/news/api')]),
  [ROUTES.BLOG]: () => Promise.all([import('@/pages/BlogPage'), import('@/modules/blog/api')]),
  [ROUTES.EVENTS]: () => Promise.all([import('@/pages/EventsPage'), import('@/modules/events/api')]),
  [ROUTES.STORE]: () => Promise.all([import('@/pages/StorePage'), import('@/modules/store/api')]),
} as const

const prefetchedRoutes = new Set<string>()

export function prefetchRoute(path: string) {
  const prefetcher = routePrefetchers[path as keyof typeof routePrefetchers]
  if (!prefetcher || prefetchedRoutes.has(path)) return

  prefetchedRoutes.add(path)
  void prefetcher().catch(() => {
    prefetchedRoutes.delete(path)
  })
}
