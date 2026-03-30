import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/lib/routes'
import AuthButton from '@/components/auth/AuthButton'

const NAV_ITEMS = [
  { key: 'nav.works', to: ROUTES.WORKS },
  { key: 'nav.news', to: ROUTES.NEWS },
  { key: 'nav.blog', to: ROUTES.BLOG },
  { key: 'nav.fanclub', to: ROUTES.FANCLUB },
  { key: 'nav.contact', to: ROUTES.CONTACT },
] as const

export default function Header() {
  const { t } = useTranslation()

  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <NavLink to={ROUTES.HOME} className="text-lg font-semibold tracking-tight text-gray-900">
          Creava
        </NavLink>

        <div className="flex items-center gap-6">
          <nav>
            <ul className="flex items-center gap-6">
              {NAV_ITEMS.map(({ key, to }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `text-sm transition-colors ${
                        isActive
                          ? 'text-gray-900 font-medium'
                          : 'text-gray-500 hover:text-gray-900'
                      }`
                    }
                  >
                    {t(key)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <AuthButton />
        </div>
      </div>
    </header>
  )
}
