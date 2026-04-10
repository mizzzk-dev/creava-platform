import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHead from '@/components/seo/PageHead'
import { MAIN_SITE_URL } from '@/lib/siteLinks'
import { trackCtaClick } from '@/modules/analytics/tracking'

export default function StorefrontGuidePage() {
  const { t } = useTranslation()

  const guideLinks = [
    { to: '/shipping-policy', labelKey: 'storefront.guide.links.shipping' },
    { to: '/returns', labelKey: 'storefront.guide.links.returns' },
    { to: '/terms', labelKey: 'storefront.guide.links.terms' },
    { to: '/privacy', labelKey: 'storefront.guide.links.privacy' },
    { to: '/legal/tokushoho', labelKey: 'storefront.guide.links.tokushoho' },
  ] as const

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <PageHead
        title={`${t('storefront.guide.title')} | mizzz Official Store`}
        description={t('storefront.guide.lead')}
      />

      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
        store guide
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
        {t('storefront.guide.title')}
      </h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {t('storefront.guide.lead')}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {guideLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => trackCtaClick('store_guide', 'policy_link', { target: link.to })}
            className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 transition hover:border-gray-400 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:border-gray-600"
          >
            <span>{t(link.labelKey)}</span>
            <span className="text-gray-400 transition group-hover:translate-x-0.5 dark:text-gray-600">→</span>
          </Link>
        ))}
        <a
          href={`${MAIN_SITE_URL}/contact`}
          onClick={() => trackCtaClick('store_guide', 'contact_link')}
          className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 transition hover:border-gray-400 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:border-gray-600"
        >
          <span>{t('storefront.guide.links.contact')}</span>
          <span className="text-gray-400 transition group-hover:translate-x-0.5 dark:text-gray-600">↗</span>
        </a>
      </div>

      <p className="mt-5 text-xs text-gray-500 dark:text-gray-400">
        {t('storefront.guide.contactNote')}
      </p>
    </section>
  )
}
