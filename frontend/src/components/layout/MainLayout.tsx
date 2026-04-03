import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import PreviewBanner from '@/components/common/PreviewBanner'
import LoadingScreen from '@/components/common/LoadingScreen'

export default function MainLayout() {
  return (
    <>
      <LoadingScreen />
      <div className="flex min-h-screen flex-col">
        {/* プレビューモード中のみ表示 */}
        <PreviewBanner />
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  )
}
