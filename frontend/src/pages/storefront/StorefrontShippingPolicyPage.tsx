import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import PageHead from '@/components/seo/PageHead'
import { MAIN_SITE_URL } from '@/lib/siteLinks'

export default function StorefrontShippingPolicyPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <PageHead
        title={`${t('storefront.shipping.title')} | mizzz Official Store`}
        description={t('storefront.shipping.description')}
      />

      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
        shipping policy
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
        {t('storefront.shipping.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {t('storefront.shipping.subtitle')}
      </p>

      {/* 基本方針 */}
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-7 text-gray-600 dark:text-gray-300">
        <li>{t('storefront.shipping.standard')}</li>
        <li>{t('storefront.shipping.preorder')}</li>
        <li>{t('storefront.shipping.domestic')}</li>
      </ul>

      {/* 詳細情報 */}
      <div className="mt-10 space-y-6">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/50">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {t('storefront.shipping.feeTitle')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t('storefront.shipping.feeBody')}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/50">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {t('storefront.shipping.trackingTitle')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t('storefront.shipping.trackingBody')}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/50">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {t('storefront.shipping.delayTitle')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t('storefront.shipping.delayBody')}
          </p>
        </div>
      </div>

      {/* 関連導線 */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/returns"
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 transition hover:border-gray-400 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500"
        >
          {t('storefront.guide.links.returns')} →
        </Link>
        <Link
          to="/guide"
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 transition hover:border-gray-400 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500"
        >
          {t('storefront.guide.title')} →
        </Link>
      </div>

      <p className="mt-5 text-xs text-gray-500 dark:text-gray-400">
        {t('storefront.shipping.contactNote')}{' '}
        <a
          href={`${MAIN_SITE_URL}/contact`}
          className="underline-offset-2 hover:underline"
        >
          {t('storefront.shipping.contactLink')}
        </a>
        {t('storefront.shipping.contactNoteSuffix')}
      </p>
    </section>
  )
}
