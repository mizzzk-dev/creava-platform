import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { trackErrorState, trackRetryClick } from '@/modules/analytics/tracking'

interface Props {
  message: string
  onRetry?: () => void
  location?: string
}

/**
 * API エラー時の表示
 */
export default function ErrorState({ message, onRetry, location = 'unknown' }: Props) {
  const { t } = useTranslation()
  useEffect(() => {
    trackErrorState(location, message)
  }, [location, message])

  return (
    <div className="rounded border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-4 py-6">
      <p className="text-sm font-medium text-red-600 dark:text-red-400">{t('common.error')}</p>
      <p className="mt-1 font-mono text-xs text-red-400 dark:text-red-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={() => {
            trackRetryClick(location)
            onRetry()
          }}
          className="mt-3 inline-flex items-center rounded border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-100/70 dark:hover:bg-red-900/40"
        >
          {t('common.retry', { defaultValue: '再試行' })}
        </button>
      )}
    </div>
  )
}
