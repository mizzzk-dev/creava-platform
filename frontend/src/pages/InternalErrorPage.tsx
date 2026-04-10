import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import PageHead from '@/components/seo/PageHead'
import { trackCtaClick } from '@/modules/analytics/tracking'

interface Props {
  code?: '500' | '503'
  onRetry?: () => void
}

/* ── Pulsing signal indicator ── */
function SignalDot({ delay = 0 }: { delay?: number }) {
  return (
    <motion.span
      className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{ duration: 1.4, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  )
}

export default function InternalErrorPage({ code = '500', onRetry }: Props) {
  const { t } = useTranslation()

  const is503 = code === '503'

  const title = is503
    ? t('error.503title', { defaultValue: 'メンテナンス中です' })
    : t('error.500title', { defaultValue: '予期しないエラーが発生しました' })

  const description = is503
    ? t('error.503sub', { defaultValue: 'ただいまシステムメンテナンス中です。しばらくしてから再度アクセスしてください。' })
    : t('error.500sub', { defaultValue: '一時的な問題が発生しました。時間をおいて再度お試しください。' })

  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
      <PageHead title={code} noindex />

      {/* ── Ambient elements ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(rgba(100,100,120,1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,120,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute left-6 top-6 h-10 w-10 border-l-2 border-t-2 border-gray-200 dark:border-amber-500/15" />
        <div className="absolute right-6 top-6 h-10 w-10 border-r-2 border-t-2 border-gray-200 dark:border-amber-500/15" />
        <div className="absolute bottom-6 left-6 h-10 w-10 border-b-2 border-l-2 border-gray-200 dark:border-amber-500/15" />
        <div className="absolute bottom-6 right-6 h-10 w-10 border-b-2 border-r-2 border-gray-200 dark:border-amber-500/15" />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 dark:opacity-100"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* signal dots */}
        <motion.div
          className="mb-6 flex items-center justify-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <SignalDot delay={0} />
          <SignalDot delay={0.2} />
          <SignalDot delay={0.4} />
          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.25em] text-amber-500/60">
            {is503 ? 'maintenance' : `error ${code}`}
          </span>
        </motion.div>

        {/* Large code number */}
        <div className="relative mb-6 select-none" aria-hidden="true">
          <span
            className="pointer-events-none absolute inset-0 font-mono font-bold leading-none"
            style={{
              fontSize: 'clamp(5rem, 20vw, 11rem)',
              color: 'rgba(245,158,11,0.06)',
              filter: 'blur(14px)',
            }}
          >
            {code}
          </span>
          <span
            className="relative font-mono font-bold leading-none text-gray-100 dark:text-white/[0.04]"
            style={{ fontSize: 'clamp(5rem, 20vw, 11rem)' }}
          >
            {code}
          </span>
        </div>

        {/* message */}
        <motion.div
          className="mb-8 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {title}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </motion.div>

        {/* ── Action buttons ── */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {onRetry && (
            <button
              type="button"
              onClick={() => {
                trackCtaClick(`${code}_page`, 'retry_click')
                onRetry()
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-900 bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
            >
              <span>↺</span>
              {t('common.retry', { defaultValue: '再試行' })}
            </button>
          )}
          {!onRetry && (
            <button
              type="button"
              onClick={() => {
                trackCtaClick(`${code}_page`, 'reload_click')
                window.location.reload()
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-900 bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
            >
              <span>↺</span>
              {t('error.reload', { defaultValue: 'ページを再読み込み' })}
            </button>
          )}
          <Link
            to={ROUTES.HOME}
            onClick={() => trackCtaClick(`${code}_page`, 'back_home_click')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-gray-600"
          >
            {t('common.backToHome', { defaultValue: 'ホームへ戻る' })}
          </Link>
          <Link
            to={ROUTES.CONTACT}
            onClick={() => trackCtaClick(`${code}_page`, 'contact_click')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-gray-600"
          >
            {t('nav.contact', { defaultValue: 'お問い合わせ' })}
          </Link>
        </motion.div>

        {/* hint */}
        <motion.p
          className="mt-8 font-mono text-[10px] text-gray-300 dark:text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {is503
            ? t('error.503hint', { defaultValue: '復旧まで今しばらくお待ちください。' })
            : t('error.500hint', { defaultValue: '問題が続く場合はお問い合わせください。' })}
        </motion.p>
      </motion.div>
    </section>
  )
}
