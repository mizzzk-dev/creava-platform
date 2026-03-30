import { Routes, Route } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import HomePage from '@/pages/HomePage'
import WorksPage from '@/pages/WorksPage'
import NewsPage from '@/pages/NewsPage'
import BlogPage from '@/pages/BlogPage'
import FanclubPage from '@/pages/FanclubPage'
import ContactPage from '@/pages/ContactPage'
import NotFoundPage from '@/pages/NotFoundPage'

export const ROUTES = {
  HOME: '/',
  WORKS: '/works',
  NEWS: '/news',
  BLOG: '/blog',
  FANCLUB: '/fanclub',
  CONTACT: '/contact',
} as const

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.WORKS} element={<WorksPage />} />
        <Route path={ROUTES.NEWS} element={<NewsPage />} />
        <Route path={ROUTES.BLOG} element={<BlogPage />} />
        <Route path={ROUTES.FANCLUB} element={<FanclubPage />} />
        <Route path={ROUTES.CONTACT} element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
