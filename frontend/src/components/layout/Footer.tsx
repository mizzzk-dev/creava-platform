import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/lib/routeConstants'
import SiteLogo from '@/components/layout/SiteLogo'

const NAV_LINKS = [
  { key: 'nav.about',   to: ROUTES.ABOUT   },
  { key: 'nav.works',   to: ROUTES.WORKS   },
  { key: 'nav.news',    to: ROUTES.NEWS    },
  { key: 'nav.blog',    to: ROUTES.BLOG    },
  { key: 'nav.events',  to: ROUTES.EVENTS  },
  { key: 'nav.fanclub', to: ROUTES.FANCLUB },
  { key: 'nav.pricing', to: ROUTES.PRICING },
  { key: 'nav.faq',     to: ROUTES.FAQ     },
  { key: 'nav.contact', to: ROUTES.CONTACT },
] as const

const SNS_LINKS = [
  { label: 'X', envKey: 'VITE_SNS_X_URL' },
  { label: 'Instagram', envKey: 'VITE_SNS_INSTAGRAM_URL' },
  { label: 'note', envKey: 'VITE_SNS_NOTE_URL' },
  { label: 'YouTube', envKey: 'VITE_SNS_YOUTUBE_URL' },
] as const

export default function Footer() {
  const { t } = useTranslation()

  const activeSns = SNS_LINKS.filter(({ envKey }) =>
    Boolean((import.meta.env as Record<string, string>)[envKey]),
  )

  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Link
              to={ROUTES.HOME}
              className="transition-opacity hover:opacity-70 inline-block"
              aria-label="mizzz Home"
            >
              <SiteLogo />
            </Link>
            <p className="font-mono text-[11px] text-gray-400 dark:text-gray-600">
              creator homepage / portfolio + request hub
            </p>

            {activeSns.length > 0 && (
              <div className="flex gap-3 pt-1">
                {activeSns.map(({ label, envKey }) => (
                  <a
                    key={label}
                    href={(import.meta.env as Record<string, string>)[envKey]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-400 transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <nav>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {NAV_LINKS.map(({ key, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-xs text-gray-400 dark:text-gray-600 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-gray-50 dark:border-gray-900 pt-6">
          <p className="font-mono text-[11px] text-gray-300 dark:text-gray-700">{t('footer.copyright')}</p>
          <span className="font-mono text-[10px] text-gray-200 dark:text-gray-800 select-none">// mizzz</span>
        </div>
      </div>
    </footer>
  )
}
