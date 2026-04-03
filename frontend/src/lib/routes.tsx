import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import HomePage from '@/pages/HomePage'
import SkeletonDetail from '@/components/common/SkeletonDetail'

// Lazy-loaded pages — excluded from the initial bundle
const WorksPage = lazy(() => import('@/pages/WorksPage'))
const WorkDetailPage = lazy(() => import('@/pages/WorkDetailPage'))
const NewsPage = lazy(() => import('@/pages/NewsPage'))
const NewsDetailPage = lazy(() => import('@/pages/NewsDetailPage'))
const BlogPage = lazy(() => import('@/pages/BlogPage'))
const BlogDetailPage = lazy(() => import('@/pages/BlogDetailPage'))
const FanclubPage = lazy(() => import('@/pages/FanclubPage'))
const FanclubDetailPage = lazy(() => import('@/pages/FanclubDetailPage'))
const EventsPage = lazy(() => import('@/pages/EventsPage'))
const EventDetailPage = lazy(() => import('@/pages/EventDetailPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const StorePage = lazy(() => import('@/pages/StorePage'))
const StoreDetailPage = lazy(() => import('@/pages/StoreDetailPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const PreviewPage = lazy(() => import('@/pages/PreviewPage'))

// 定数は循環参照を避けるため routeConstants から取得し re-export する
export { ROUTES, detailPath } from './routeConstants'
import { ROUTES } from './routeConstants'

function PageLoader() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20">
      <SkeletonDetail />
    </div>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.WORKS} element={<WorksPage />} />
          <Route path={ROUTES.WORK_DETAIL} element={<WorkDetailPage />} />
          <Route path={ROUTES.NEWS} element={<NewsPage />} />
          <Route path={ROUTES.NEWS_DETAIL} element={<NewsDetailPage />} />
          <Route path={ROUTES.BLOG} element={<BlogPage />} />
          <Route path={ROUTES.BLOG_DETAIL} element={<BlogDetailPage />} />
          <Route path={ROUTES.FANCLUB} element={<FanclubPage />} />
          <Route path={ROUTES.FANCLUB_DETAIL} element={<FanclubDetailPage />} />
          <Route path={ROUTES.EVENTS} element={<EventsPage />} />
          <Route path={ROUTES.EVENT_DETAIL} element={<EventDetailPage />} />
          <Route path={ROUTES.CONTACT} element={<ContactPage />} />
          <Route path={ROUTES.STORE} element={<StorePage />} />
          <Route path={ROUTES.STORE_DETAIL} element={<StoreDetailPage />} />
          <Route path={ROUTES.PREVIEW} element={<PreviewPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
