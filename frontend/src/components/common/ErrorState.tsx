import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
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
    <motion.div
      className="relative overflow-hidden"
      style={{
        border: '1px solid rgba(239,68,68,0.2)',
        background: 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, transparent 60%)',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* top accent line */}
      <div className="absolute left-0 top-0 h-px w-full" style={{ background: 'linear-gradient(to right, rgba(239,68,68,0.5), transparent)' }} />

      <div className="grid gap-4 px-5 py-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-red-400/60 mb-2">
            // error_state
          </p>
          <p className="text-sm font-medium text-red-500 dark:text-red-400">{t('common.error')}</p>
          <p className="mt-1 font-mono text-xs text-red-400/70 dark:text-red-500/70">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={() => {
                trackRetryClick(location)
                onRetry()
              }}
              className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors"
              style={{ color: 'rgba(239,68,68,0.7)' }}
            >
              <span style={{ color: 'rgba(239,68,68,0.4)' }}>↺</span>
              {t('common.retry', { defaultValue: '再試行' })}
            </button>
          )}
        </div>
        <BrandIllustration variant="support" className="min-h-40" />
      </div>
    </motion.div>
  )
}
