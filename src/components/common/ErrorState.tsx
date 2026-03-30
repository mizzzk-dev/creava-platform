import { useTranslation } from 'react-i18next'

interface Props {
  message: string
}

/**
 * API エラー時の表示
 */
export default function ErrorState({ message }: Props) {
  const { t } = useTranslation()

  return (
    <div className="rounded border border-red-200 bg-red-50 px-4 py-6">
      <p className="text-sm font-medium text-red-600">{t('common.error')}</p>
      <p className="mt-1 font-mono text-xs text-red-400">{message}</p>
    </div>
  )
}
