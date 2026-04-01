import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/lib/routeConstants'
import PageHead from '@/components/seo/PageHead'

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto flex max-w-5xl flex-col items-center px-4 py-40 text-center">
      <PageHead title="404" noindex />
      <p className="text-6xl font-bold text-gray-200">404</p>
      <p className="mt-4 text-lg text-gray-500">{t('common.notFound')}</p>
      <Link
        to={ROUTES.HOME}
        className="mt-8 text-sm text-gray-700 underline underline-offset-4 hover:text-gray-900"
      >
        {t('common.backToHome')}
      </Link>
    </section>
  )
}
