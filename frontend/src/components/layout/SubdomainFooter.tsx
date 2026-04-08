import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LangSwitcher from '@/components/common/LangSwitcher'
import SmartLink from '@/components/common/SmartLink'
import { ROUTES } from '@/lib/routeConstants'
import { mainLink, fanclubLink, storeLink } from '@/lib/siteLinks'

interface FooterLink {
  to: string
  label: string
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
              store / fanclub / main を横断して、作品・ニュース・購入・会員体験を自然に回遊できる導線設計を維持しています。
            </p>
            <SmartLink to={mainLink(ROUTES.CONTACT)} className="mt-4 inline-flex rounded-full border border-gray-300 px-4 py-2 text-xs text-gray-700 transition-colors hover:border-gray-500 dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500">
              {t('nav.contact')} (mizzz.jp)
            </SmartLink>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Navigate</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li><SmartLink to={mainLink('/')}>mizzz.jp</SmartLink></li>
              <li><SmartLink to={storeLink('/')}>{t('nav.store')}</SmartLink></li>
              <li><SmartLink to={fanclubLink('/')}>{t('nav.fanclub')}</SmartLink></li>
              <li><NavLink to={ROUTES.FAQ}>{t('nav.faq')}</NavLink></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              {legalLinks.map((link) => (
                <li key={link.to}><NavLink to={link.to}>{link.label}</NavLink></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5 dark:border-gray-900">
          <p className="text-[11px] text-gray-400 dark:text-gray-600">© 2026 mizzz. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 dark:text-gray-600">Language</span>
            <LangSwitcher />
          </div>
        </div>
      </div>
    </footer>
  )
}
