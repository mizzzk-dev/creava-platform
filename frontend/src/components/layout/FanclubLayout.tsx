import { Outlet, NavLink } from 'react-router-dom'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/lib/routeConstants'
import { trackPageView } from '@/modules/analytics'
import AuthButton from '@/components/auth/AuthButton'

const FC_NAV = [
  { label: 'ABOUT', to: ROUTES.FC_ABOUT },
  { label: 'JOIN', to: ROUTES.FC_JOIN },
  { label: 'NEWS', to: ROUTES.NEWS },
  { label: 'BLOG', to: ROUTES.BLOG },
  { label: 'MOVIES', to: ROUTES.FC_MOVIES },
  { label: 'GALLERY', to: ROUTES.FC_GALLERY },
  { label: 'EVENTS', to: ROUTES.EVENTS },
  { label: 'TICKETS', to: ROUTES.FC_TICKETS },
  { label: 'FAQ', to: ROUTES.FAQ },
]

export default function FanclubLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to={ROUTES.HOME} className="font-mono text-xs tracking-[0.2em] text-gray-600 dark:text-gray-300">MIZZZ FC</NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            {FC_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `rounded-md px-2.5 py-1.5 text-xs tracking-wider ${isActive ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900'}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <AuthButton />
        </div>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-gray-500">
          <p>© mizzz official fanclub</p>
          <div className="flex gap-4">
            <NavLink to={ROUTES.FC_GUIDE}>GUIDE</NavLink>
            <NavLink to={ROUTES.FC_TERMS}>TERMS</NavLink>
            <NavLink to={ROUTES.FC_PRIVACY}>PRIVACY</NavLink>
            <NavLink to={ROUTES.CONTACT}>CONTACT</NavLink>
          </div>
        </div>
      </footer>
    </div>
  )
}
