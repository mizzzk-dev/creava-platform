import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import PreviewBanner from '@/components/common/PreviewBanner'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* プレビューモード中のみ表示 */}
      <PreviewBanner />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
