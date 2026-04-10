import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import PageHead from '@/components/seo/PageHead'
import { MAIN_SITE_URL } from '@/lib/siteLinks'

export default function StorefrontReturnsPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <PageHead
        title={`${t('storefront.returns.title')} | mizzz Official Store`}
        description={t('storefront.returns.description')}
      />

      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
        returns & exchanges
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
        {t('storefront.returns.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {t('storefront.returns.subtitle')}
      </p>

      {/* 基本方針 */}
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-7 text-gray-600 dark:text-gray-300">
        <li>{t('storefront.returns.noReturn')}</li>
        <li>{t('storefront.returns.defective')}</li>
        <li>{t('storefront.returns.digital')}</li>
      </ul>

      {/* 手順 */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {t('storefront.returns.procedureTitle')}
        </h2>
        <ol className="mt-4 space-y-3">
          {(['step1', 'step2', 'step3'] as const).map((step, index) => (
            <li
              key={step}
              className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 font-mono text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                {index + 1}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t(`storefront.returns.${step}`)}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* 注意事項 */}
      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-900/10">
        <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
          {t('storefront.returns.noteTitle')}
        </h2>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300/80">
          {t('storefront.returns.noteBody')}
        </p>
      </div>

      {/* 関連導線 */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/shipping-policy"
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 transition hover:border-gray-400 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500"
        >
          {t('storefront.guide.links.shipping')} →
        </Link>
        <Link
          to="/guide"
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 transition hover:border-gray-400 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500"
        >
          {t('storefront.guide.title')} →
        </Link>
      </div>

      <p className="mt-5 text-xs text-gray-500 dark:text-gray-400">
        {t('storefront.returns.contactNote')}{' '}
        <a
          href={`${MAIN_SITE_URL}/contact`}
          className="underline-offset-2 hover:underline"
        >
          {t('storefront.returns.contactLink')}
        </a>
        {t('storefront.returns.contactNoteSuffix')}
      </p>
    </section>
  )
}
