import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/lib/routeConstants'
import SiteLogo from '@/components/layout/SiteLogo'
import { resetCookieConsent } from '@/modules/cookie/consent'

const PRIMARY_LINKS = [
  { key: 'nav.store', to: ROUTES.STORE },
  { key: 'nav.fanclub', to: ROUTES.FANCLUB },
  { key: 'nav.contact', to: ROUTES.CONTACT },
] as const

const SUPPORT_LINKS = [
  { key: 'nav.faq', to: ROUTES.FAQ },
  { key: 'footer.cart', to: ROUTES.CART },
] as const

const LEGAL_LINKS = [
  { key: 'footer.privacy', to: ROUTES.LEGAL_PRIVACY },
  { key: 'footer.terms', to: ROUTES.LEGAL_TERMS },
  { key: 'footer.cookie', to: ROUTES.LEGAL_COOKIE },
  { key: 'footer.trade', to: ROUTES.LEGAL_TRADE },
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
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Link to={ROUTES.HOME} className="transition-opacity hover:opacity-70 inline-block" aria-label="mizzz Home">
              <SiteLogo />
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-500">{t('footer.brandCopy')}</p>
            {activeSns.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-2 pt-1">
                {activeSns.map(({ label, envKey }) => (
                  <a
                    key={label}
                    href={(import.meta.env as Record<string, string>)[envKey]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <nav aria-label="Primary footer navigation">
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-600">Explore</p>
            <ul className="mt-3 space-y-2">
              {PRIMARY_LINKS.map(({ key, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-500 dark:text-gray-500 transition-colors hover:text-gray-800 dark:hover:text-gray-200">
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Support footer navigation">
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-600">Support</p>
            <ul className="mt-3 space-y-2">
              {SUPPORT_LINKS.map(({ key, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-500 dark:text-gray-500 transition-colors hover:text-gray-800 dark:hover:text-gray-200">
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal footer navigation">
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-600">Legal</p>
            <ul className="mt-3 space-y-2">
              {LEGAL_LINKS.map(({ key, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-500 dark:text-gray-500 transition-colors hover:text-gray-800 dark:hover:text-gray-200">
                    {t(key)}
                  </Link>
                </li>
              ))}
              <li>
                <button onClick={resetCookieConsent} className="text-left text-sm text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                  {t('footer.cookieSettings')}
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-gray-50 dark:border-gray-900 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-gray-400 dark:text-gray-600">{t('footer.copyright')}</p>
          <span className="font-mono text-[10px] text-gray-300 dark:text-gray-700 select-none">// mizzz</span>
        </div>
      </div>
    </footer>
  )
}
