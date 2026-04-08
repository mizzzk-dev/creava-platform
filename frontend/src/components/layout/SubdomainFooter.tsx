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
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SmartLink to={mainLink('/')}>mizzz.jp</SmartLink>
          <SmartLink to={storeLink('/')}>{t('nav.store')}</SmartLink>
          <SmartLink to={fanclubLink('/')}>{t('nav.fanclub')}</SmartLink>
          <NavLink to={ROUTES.FAQ}>{t('nav.faq')}</NavLink>
          <SmartLink to={mainLink(ROUTES.CONTACT)}>{t('nav.contact')} (mizzz.jp)</SmartLink>
          {legalLinks.map((link) => (
            <NavLink key={link.to} to={link.to}>{link.label}</NavLink>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-900">
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
