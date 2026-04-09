import { Link } from 'react-router-dom'
import SmartLink from '@/components/common/SmartLink'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import { fanclubLink, storeLink } from '@/lib/siteLinks'
import SiteLogo from '@/components/layout/SiteLogo'
import { resetCookieConsent } from '@/modules/cookie/consent'

const PRIMARY_LINKS = [
  { key: 'nav.store',   to: storeLink(ROUTES.STORE) },
  { key: 'nav.fanclub', to: fanclubLink(ROUTES.FANCLUB) },
  { key: 'nav.request', to: `${ROUTES.CONTACT}?tab=request` },
  { key: 'nav.contact', to: ROUTES.CONTACT },
] as const

const SUPPORT_LINKS = [
  { key: 'nav.faq',    to: ROUTES.FAQ  },
  { key: 'footer.cart', to: ROUTES.CART },
] as const

const LEGAL_LINKS = [
  { key: 'footer.privacy', to: ROUTES.LEGAL_PRIVACY },
  { key: 'footer.terms',   to: ROUTES.LEGAL_TERMS   },
  { key: 'footer.cookie',  to: ROUTES.LEGAL_COOKIE  },
  { key: 'footer.trade',   to: ROUTES.LEGAL_TRADE   },
] as const

const SNS_LINKS = [
  { label: 'X',         envKey: 'VITE_SNS_X_URL'         },
  { label: 'Instagram', envKey: 'VITE_SNS_INSTAGRAM_URL'  },
  { label: 'note',      envKey: 'VITE_SNS_NOTE_URL'       },
  { label: 'YouTube',   envKey: 'VITE_SNS_YOUTUBE_URL'    },
] as const

export default function Footer() {
  const { t } = useTranslation()

  const activeSns = SNS_LINKS.filter(({ envKey }) =>
    Boolean((import.meta.env as Record<string, string>)[envKey]),
  )

  return (
    <footer className="relative overflow-hidden border-t border-[rgba(6,182,212,0.08)]">
      {/* cyber grid */}
      <div className="cyber-grid pointer-events-none absolute inset-0 opacity-15" />

      <div className="relative mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">

          {/* brand column */}
          <div className="space-y-4">
            <Link to={ROUTES.HOME} className="inline-block transition-opacity hover:opacity-70" aria-label="mizzz Home">
              <SiteLogo />
            </Link>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-[rgba(180,190,220,0.45)]">
              {t('footer.brandCopy')}
            </p>
            {activeSns.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-2 pt-1">
                {activeSns.map(({ label, envKey }) => (
                  <a
                    key={label}
                    href={(import.meta.env as Record<string, string>)[envKey]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] uppercase tracking-widest text-[rgba(6,182,212,0.35)] transition-colors hover:text-cyan-400"
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Explore */}
          <nav aria-label="Primary footer navigation">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/40 mb-4">
              // explore
            </p>
            <ul className="space-y-2.5">
              {PRIMARY_LINKS.map(({ key, to }) => (
                <li key={to}>
                  <SmartLink
                    to={to}
                    className="group inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-[rgba(180,190,220,0.45)] transition-colors hover:text-cyan-400"
                  >
                    <span className="font-mono text-[8px] text-cyan-500/0 group-hover:text-cyan-500/40 transition-colors">›</span>
                    {t(key)}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support */}
          <nav aria-label="Support footer navigation">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/40 mb-4">
              // support
            </p>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map(({ key, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-[rgba(180,190,220,0.45)] transition-colors hover:text-cyan-400"
                  >
                    <span className="font-mono text-[8px] text-cyan-500/0 group-hover:text-cyan-500/40 transition-colors">›</span>
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal footer navigation">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/40 mb-4">
              // legal
            </p>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(({ key, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-[rgba(180,190,220,0.45)] transition-colors hover:text-cyan-400"
                  >
                    <span className="font-mono text-[8px] text-cyan-500/0 group-hover:text-cyan-500/40 transition-colors">›</span>
                    {t(key)}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={resetCookieConsent}
                  className="group inline-flex items-center gap-1.5 text-left text-sm text-gray-500 dark:text-[rgba(180,190,220,0.45)] transition-colors hover:text-cyan-400"
                >
                  <span className="font-mono text-[8px] text-cyan-500/0 group-hover:text-cyan-500/40 transition-colors">›</span>
                  {t('footer.cookieSettings')}
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* bottom bar */}
        <div className="mt-10 border-t border-[rgba(6,182,212,0.08)] pt-6">
          {/* gradient line */}
          <motion.div
            className="mb-6 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(6,182,212,0.2) 30%, rgba(139,92,246,0.2) 70%, transparent)' }}
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[10px] text-[rgba(6,182,212,0.25)]">
              {t('footer.copyright')}
            </p>
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[rgba(6,182,212,0.2)] select-none">
              // mizzz_official
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
