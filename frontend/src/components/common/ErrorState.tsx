import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { trackErrorState, trackRetryClick } from '@/modules/analytics/tracking'
import BrandIllustration from '@/components/common/BrandIllustration'

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
    <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-5 dark:border-red-900/40 dark:bg-red-950/20">
      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{t('common.error')}</p>
          <p className="mt-1 font-mono text-xs text-red-400 dark:text-red-600">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={() => {
                trackRetryClick(location)
                onRetry()
              }}
              className="mt-3 inline-flex items-center rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100/70 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/40"
            >
              {t('common.retry', { defaultValue: '再試行' })}
            </button>
          )}
        </div>
        <BrandIllustration variant="support" className="min-h-40" />
      </div>
    </div>
  )
}
