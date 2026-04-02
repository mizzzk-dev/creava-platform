import { Routes, Route } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import HomePage from '@/pages/HomePage'
import WorksPage from '@/pages/WorksPage'
import WorkDetailPage from '@/pages/WorkDetailPage'
import NewsPage from '@/pages/NewsPage'
import NewsDetailPage from '@/pages/NewsDetailPage'
import BlogPage from '@/pages/BlogPage'
import BlogDetailPage from '@/pages/BlogDetailPage'
import FanclubPage from '@/pages/FanclubPage'
import FanclubDetailPage from '@/pages/FanclubDetailPage'
import ContactPage from '@/pages/ContactPage'
import NotFoundPage from '@/pages/NotFoundPage'
import StorePage from '@/pages/StorePage'
import StoreDetailPage from '@/pages/StoreDetailPage'
import EventsPage from '@/pages/EventsPage'
import EventDetailPage from '@/pages/EventDetailPage'

// 定数は循環参照を避けるため routeConstants から取得し re-export する
export { ROUTES, detailPath } from './routeConstants'
import { ROUTES } from './routeConstants'

export function AppRoutes() {
  return (
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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
