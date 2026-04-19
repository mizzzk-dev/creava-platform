import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { trackErrorState, trackRetryClick, trackCtaClick } from '@/modules/analytics/tracking'
import BrandIllustration from '@/components/common/BrandIllustration'
import { ROUTES } from '@/lib/routeConstants'

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
      className="relative overflow-hidden rounded-3xl border border-red-300/40 bg-gradient-to-br from-red-50/80 via-white to-amber-50/50 shadow-sm dark:border-red-500/30 dark:from-red-950/20 dark:via-gray-950 dark:to-amber-950/10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-red-500/60 via-red-400/30 to-transparent" />

      <div className="grid gap-4 px-5 py-5 md:grid-cols-[1.15fr_0.85fr] md:items-center">
        <div>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-red-500/60 dark:text-red-400/70">
            // resilient_error_state
          </p>
          <p className="text-sm font-semibold text-red-600 dark:text-red-300">{t('common.error')}</p>
          <p className="mt-1 text-xs leading-6 text-red-500/90 dark:text-red-300/90">{message}</p>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {t('experience.errorHint', { defaultValue: '時間をおいて再試行するか、FAQ・お問い合わせから解決方法をご確認ください。' })}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={() => {
                  trackRetryClick(location)
                  onRetry()
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-400/50 bg-red-500/10 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-red-500 transition-colors hover:bg-red-500/15 dark:border-red-500/40 dark:text-red-300"
              >
                <span>↺</span>
                {t('common.retry', { defaultValue: '再試行' })}
              </button>
            )}
            <Link
              to={ROUTES.FAQ}
              onClick={() => trackCtaClick('error_state', 'to_faq', { location })}
              className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              FAQ
            </Link>
            <Link
              to={ROUTES.CONTACT}
              onClick={() => trackCtaClick('error_state', 'to_contact', { location })}
              className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              {t('nav.contact')}
            </Link>
          </div>
        </div>
        <BrandIllustration variant="support" className="min-h-40" />
      </div>
    </motion.div>
  )
}
