import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-center">
        <p className="text-sm text-gray-400">{t('footer.copyright')}</p>
      </div>
    </footer>
  )
}
