import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/lib/routeConstants'

const NAV_LINKS = [
  { key: 'nav.works',   to: ROUTES.WORKS   },
  { key: 'nav.news',    to: ROUTES.NEWS    },
  { key: 'nav.blog',    to: ROUTES.BLOG    },
  { key: 'nav.events',  to: ROUTES.EVENTS  },
  { key: 'nav.fanclub', to: ROUTES.FANCLUB },
  { key: 'nav.contact', to: ROUTES.CONTACT },
] as const

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* brand */}
          <div>
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-2 text-sm font-semibold text-gray-900 transition-opacity hover:opacity-70"
            >
              <span className="font-mono text-[10px] text-gray-300 select-none">&gt;_</span>
              Creava
            </Link>
            <p className="mt-1 font-mono text-[11px] text-gray-400">
              creator portfolio / v2.0
            </p>
          </div>

          {/* nav links */}
          <nav>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {NAV_LINKS.map(({ key, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-xs text-gray-400 transition-colors hover:text-gray-700"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* bottom bar */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-50 pt-6">
          <p className="font-mono text-[11px] text-gray-300">{t('footer.copyright')}</p>
          <span className="font-mono text-[10px] text-gray-200 select-none">// EOF</span>
        </div>
      </div>
    </footer>
  )
}
