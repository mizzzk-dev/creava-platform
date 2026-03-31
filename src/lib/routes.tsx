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

/** ルートパスの定数（Route element で使用） */
export const ROUTES = {
  HOME: '/',
  WORKS: '/works',
  WORK_DETAIL: '/works/:slug',
  NEWS: '/news',
  NEWS_DETAIL: '/news/:slug',
  BLOG: '/blog',
  BLOG_DETAIL: '/blog/:slug',
  FANCLUB: '/fanclub',
  FANCLUB_DETAIL: '/fanclub/:slug',
  CONTACT: '/contact',
  STORE: '/store',
  STORE_DETAIL: '/store/:handle',
} as const

/** 詳細ページへの URL を生成する */
export const detailPath = {
  news: (slug: string) => `/news/${slug}`,
  blog: (slug: string) => `/blog/${slug}`,
  work: (slug: string) => `/works/${slug}`,
  fanclub: (slug: string) => `/fanclub/${slug}`,
  product: (handle: string) => `/store/${handle}`,
} as const

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
        <Route path={ROUTES.CONTACT} element={<ContactPage />} />
        <Route path={ROUTES.STORE} element={<StorePage />} />
        <Route path={ROUTES.STORE_DETAIL} element={<StoreDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
