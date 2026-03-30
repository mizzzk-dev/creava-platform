import { useTranslation } from 'react-i18next'

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        {t('nav.home')}
      </h1>
    </section>
  )
}
