import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import PageHead from '@/components/seo/PageHead'
import { trackCtaClick } from '@/modules/analytics/tracking'

interface Props {
  code?: '500' | '503'
  onRetry?: () => void
}

/* ── Maintenance illustration (503) ────────────────── */
function MaintenanceIllustration() {
  const prefersReduced = useReducedMotion()
  return (
    <motion.div
      className="relative mx-auto mb-8 h-24 w-24"
      animate={prefersReduced ? {} : { y: [0, -5, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 96" fill="none" className="h-full w-full">
        {/* Clock face */}
        <circle cx="48" cy="48" r="34" stroke="currentColor" strokeWidth="1.5"
          className="text-amber-200/70 dark:text-amber-400/20" />
        <circle cx="48" cy="48" r="28" stroke="currentColor" strokeWidth="1"
          className="text-amber-100/60 dark:text-amber-400/10" />
        {/* Hour marks */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
          <line
            key={i}
            x1="48" y1="18" x2="48" y2={i % 3 === 0 ? '22' : '20'}
            stroke="currentColor" strokeWidth={i % 3 === 0 ? '1.5' : '1'}
            className="text-amber-300/50 dark:text-amber-400/20"
            transform={`rotate(${deg} 48 48)`}
          />
        ))}
        {/* Hour hand — slow sweep */}
        <motion.line
          x1="48" y1="48" x2="48" y2="26"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          className="text-amber-500/70 dark:text-amber-400/60"
          animate={prefersReduced ? {} : { rotate: [0, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '48px', originY: '48px' }}
        />
        {/* Minute hand — fast sweep */}
        <motion.line
          x1="48" y1="48" x2="48" y2="20"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          className="text-amber-400/60 dark:text-amber-300/40"
          animate={prefersReduced ? {} : { rotate: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '48px', originY: '48px' }}
        />
        {/* Center */}
        <circle cx="48" cy="48" r="2.5" fill="currentColor" className="text-amber-500/80 dark:text-amber-400/60" />
        {/* Small wrench accent */}
        <motion.g
          animate={prefersReduced ? {} : { rotate: [0, 18, 0, -14, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{ originX: '78px', originY: '78px' }}
        >
          <path d="M73 74 L83 84" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className="text-amber-300/50 dark:text-amber-400/25" />
          <circle cx="72" cy="73" r="4" stroke="currentColor" strokeWidth="1.5"
            className="text-amber-300/50 dark:text-amber-400/25" />
        </motion.g>
      </svg>
    </motion.div>
  )
}

/* ── Broken signal illustration (500) ──────────────── */
function BrokenSignalIllustration() {
  const prefersReduced = useReducedMotion()
  const arcs = [
    { r: 12, delay: 0,   dim: false },
    { r: 22, delay: 0.3, dim: false },
    { r: 32, delay: 0.6, dim: true  },
    { r: 42, delay: 0.9, dim: true  },
  ]
  return (
    <motion.div
      className="relative mx-auto mb-8 h-24 w-24"
      animate={prefersReduced ? {} : { y: [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 96" fill="none" className="h-full w-full">
        {/* Wifi arcs */}
        {arcs.map(({ r, delay, dim }, i) => (
          <motion.path
            key={i}
            d={`M${48 - r * 0.7} ${56 + r * 0.1} A${r} ${r} 0 0 1 ${48 + r * 0.7} ${56 + r * 0.1}`}
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className={dim ? 'text-gray-200/40 dark:text-white/8' : 'text-gray-300/60 dark:text-white/15'}
            animate={prefersReduced ? {} : { opacity: dim ? [0.1, 0.3, 0.1] : [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay }}
          />
        ))}
        {/* Center dot */}
        <motion.circle
          cx="48" cy="68" r="3"
          fill="currentColor" className="text-gray-400/70 dark:text-white/25"
          animate={prefersReduced ? {} : { scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* X mark — error */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as const }}
        >
          <line x1="38" y1="22" x2="58" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className="text-red-400/60 dark:text-red-400/40" />
          <line x1="58" y1="22" x2="38" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className="text-red-400/60 dark:text-red-400/40" />
        </motion.g>
      </svg>
    </motion.div>
  )
}

/* ── Pulsing dots ───────────────────────────────────── */
function SignalDots({ is503 }: { is503: boolean }) {
  const dotClass = is503
    ? 'bg-amber-400 dark:bg-amber-400/70'
    : 'bg-red-400/70 dark:bg-red-400/60'
  return (
    <div className="mb-5 flex items-center justify-center gap-1.5">
      {[0, 0.25, 0.5].map((delay) => (
        <motion.span
          key={delay}
          className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`}
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export default function InternalErrorPage({ code = '500', onRetry }: Props) {
  const { t } = useTranslation()
  const prefersReduced = useReducedMotion()
  const is503 = code === '503'

  const title = is503
    ? t('error.503title', { defaultValue: 'メンテナンス中です' })
    : t('error.500title', { defaultValue: '予期しないエラーが発生しました' })

  const description = is503
    ? t('error.503sub', { defaultValue: 'ただいまシステムメンテナンス中です。しばらくしてから再度アクセスしてください。' })
    : t('error.500sub', { defaultValue: '一時的な問題が発生しました。時間をおいて再度お試しください。' })

  const glowColor = is503 ? 'rgba(245,158,11,0.05)' : 'rgba(239,68,68,0.05)'
  const bracketClass = is503
    ? 'border-amber-200/40 dark:border-amber-500/10'
    : 'border-red-200/35 dark:border-red-500/10'

  return (
    <section className="relative flex min-h-[84vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
      <PageHead title={code} noindex />

      {/* Ambient bg */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(100,100,120,1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,120,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
          animate={prefersReduced ? {} : { scale: [1, 1.10, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className={`absolute left-6 top-6 h-10 w-10 border-l-2 border-t-2 ${bracketClass}`} />
        <div className={`absolute right-6 top-6 h-10 w-10 border-r-2 border-t-2 ${bracketClass}`} />
        <div className={`absolute bottom-6 left-6 h-10 w-10 border-b-2 border-l-2 ${bracketClass}`} />
        <div className={`absolute bottom-6 right-6 h-10 w-10 border-b-2 border-r-2 ${bracketClass}`} />
        {!prefersReduced && (
          <>
            <motion.div
              className={`absolute right-[8%] top-[15%] h-20 w-20 rounded-full border ${is503 ? 'border-amber-200/20 dark:border-amber-500/8' : 'border-red-200/15 dark:border-red-500/8'}`}
              animate={{ rotate: 360 }}
              transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className={`absolute bottom-[18%] left-[6%] h-12 w-12 rounded-full border ${is503 ? 'border-amber-200/15 dark:border-amber-500/6' : 'border-red-200/12 dark:border-red-500/6'}`}
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            />
          </>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Illustration */}
        {is503 ? <MaintenanceIllustration /> : <BrokenSignalIllustration />}

        {/* Dots */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <SignalDots is503={is503} />
        </motion.div>

        {/* Label */}
        <motion.p
          className={`mb-4 font-mono text-[10px] uppercase tracking-[0.28em] ${is503 ? 'text-amber-500/60 dark:text-amber-400/50' : 'text-red-500/55 dark:text-red-400/45'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {is503 ? 'maintenance' : `error ${code}`}
        </motion.p>

        {/* Large code */}
        <div className="relative mb-6 select-none" aria-hidden="true">
          <span
            className="pointer-events-none absolute inset-0 font-mono font-bold leading-none"
            style={{
              fontSize: 'clamp(5rem, 20vw, 10rem)',
              color: is503 ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)',
              filter: 'blur(16px)',
            }}
          >
            {code}
          </span>
          <span
            className="relative font-mono font-bold leading-none text-gray-100 dark:text-white/[0.04]"
            style={{ fontSize: 'clamp(5rem, 20vw, 10rem)' }}
          >
            {code}
          </span>
        </div>

        {/* Message */}
        <motion.div
          className="mb-8 space-y-2.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white/85">{title}</p>
          <p className="text-sm leading-relaxed text-gray-500 dark:text-white/40">{description}</p>
          {is503 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-2 dark:border-amber-500/15 dark:bg-amber-500/5">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-amber-400"
                animate={prefersReduced ? {} : { opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400/80 tracking-wider">
                {t('error.503maintenance', { defaultValue: '復旧作業中です' })}
              </span>
            </div>
          )}
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {onRetry && (
            <button
              type="button"
              onClick={() => { trackCtaClick(`${code}_page`, 'retry_click'); onRetry() }}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-900 bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-700 dark:border-white/[0.10] dark:bg-white/[0.07] dark:text-white/85 dark:hover:bg-white/[0.12]"
            >
              <motion.span
                animate={prefersReduced ? {} : { rotate: [0, 360] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block' }}
              >↺</motion.span>
              {t('common.retry', { defaultValue: '再試行' })}
            </button>
          )}
          {!onRetry && (
            <button
              type="button"
              onClick={() => { trackCtaClick(`${code}_page`, 'reload_click'); window.location.reload() }}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-900 bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-700 dark:border-white/[0.10] dark:bg-white/[0.07] dark:text-white/85 dark:hover:bg-white/[0.12]"
            >
              <motion.span
                animate={prefersReduced ? {} : { rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block' }}
              >↺</motion.span>
              {t('error.reload', { defaultValue: 'ページを再読み込み' })}
            </button>
          )}
          <Link
            to={ROUTES.HOME}
            onClick={() => trackCtaClick(`${code}_page`, 'back_home_click')}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-transparent dark:text-white/60 dark:hover:border-white/[0.14]"
          >
            {t('common.backToHome', { defaultValue: 'ホームへ戻る' })}
          </Link>
          <Link
            to={ROUTES.CONTACT}
            onClick={() => trackCtaClick(`${code}_page`, 'contact_click')}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-transparent dark:text-white/60 dark:hover:border-white/[0.14]"
          >
            {t('nav.contact', { defaultValue: 'お問い合わせ' })}
          </Link>
        </motion.div>

        {/* Hint */}
        <motion.p
          className="mt-8 font-mono text-[10px] text-gray-300 dark:text-white/18"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          {is503
            ? t('error.503hint', { defaultValue: '復旧まで今しばらくお待ちください。' })
            : t('error.500hint', { defaultValue: '問題が続く場合はお問い合わせください。' })}
        </motion.p>
      </motion.div>
    </section>
  )
}
