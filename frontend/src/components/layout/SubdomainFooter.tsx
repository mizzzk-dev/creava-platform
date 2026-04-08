import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LangSwitcher from '@/components/common/LangSwitcher'
import SmartLink from '@/components/common/SmartLink'
import { ROUTES } from '@/lib/routeConstants'
import { mainLink, fanclubLink, storeLink } from '@/lib/siteLinks'
import { trackCtaClick } from '@/modules/analytics/tracking'

interface FooterLink {
  to: string
  labelKey: string
}

interface SubdomainFooterProps {
  legalLinks: FooterLink[]
}

export default function SubdomainFooter({ legalLinks }: SubdomainFooterProps) {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-gray-200/70 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-mono text-[11px] tracking-[0.16em] text-gray-500">mizzz network</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {t('subdomain.noticeMainContact')}
            </p>
            <SmartLink to={mainLink(ROUTES.CONTACT)} onClick={() => trackCtaClick('footer', 'contact_to_main')} className="mt-4 inline-flex rounded-full border border-gray-300 px-4 py-2 text-xs text-gray-700 transition-colors hover:border-gray-500 dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500">
              {t('subdomain.contactMain')}
            </SmartLink>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{t('subdomain.navigateTitle')}</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li><SmartLink to={mainLink('/')} onClick={() => trackCtaClick('footer', 'network_link', { target: 'main' })}>mizzz.jp</SmartLink></li>
              <li><SmartLink to={storeLink('/')} onClick={() => trackCtaClick('footer', 'network_link', { target: 'store' })}>{t('nav.store')}</SmartLink></li>
              <li><SmartLink to={fanclubLink('/')} onClick={() => trackCtaClick('footer', 'network_link', { target: 'fanclub' })}>{t('nav.fanclub')}</SmartLink></li>
              <li><NavLink to={ROUTES.FAQ} onClick={() => trackCtaClick('footer', 'faq')}>{t('nav.faq')}</NavLink></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{t('subdomain.legalTitle')}</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              {legalLinks.map((link) => (
                <li key={link.to}><NavLink to={link.to} onClick={() => trackCtaClick('footer', 'legal_link', { target: link.to })}>{t(link.labelKey)}</NavLink></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5 dark:border-gray-900">
          <p className="text-[11px] text-gray-400 dark:text-gray-600">© 2026 mizzz. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 dark:text-gray-600">{t('subdomain.language')}</span>
            <LangSwitcher />
          </div>
        </div>
      </div>
    </footer>
  )
}
