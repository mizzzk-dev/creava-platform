/**
 * HiddenQuote
 * スクロールで見つかる hidden quote。
 * - IntersectionObserver で viewport に入ったとき初めて可視化
 * - 「気づいた人が得した気分になる」設計
 * - フォントはブランドトーンに合わせ細め
 */
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { trackPlayfulInteraction } from '../tracking'

interface Props {
  quote: string
  author?: string
  location?: string
  className?: string
}

export default function HiddenQuote({ quote, author, location = 'hidden_quote', className = '' }: Props) {
  const reduceMotion = useReducedMotion()

  const wrapper = `relative py-8 text-center ${className}`

  if (reduceMotion) {
    return (
      <div className={wrapper}>
        <Inner quote={quote} author={author} />
      </div>
    )
  }

  return (
    <motion.div
      className={wrapper}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onViewportEnter={() =>
        trackPlayfulInteraction('hidden_quote_revealed', location)
      }
    >
      <Inner quote={quote} author={author} />
    </motion.div>
  )
}

function Inner({ quote, author }: { quote: string; author?: string }) {
  const { t } = useTranslation()
  return (
    <>
      {/* 装飾ライン */}
      <div className="mx-auto mb-5 h-px w-12 bg-gray-200 dark:bg-gray-700" aria-hidden />
      <p className="mx-auto max-w-xs text-sm font-light italic leading-7 text-gray-500 dark:text-gray-400">
        &ldquo;{quote}&rdquo;
      </p>
      {author && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
          — {author}
        </p>
      )}
      {/* hidden label */}
      <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-gray-200 dark:text-gray-700">
        {t('playful.hiddenLabel', { defaultValue: 'you found this' })}
      </p>
      <div className="mx-auto mt-5 h-px w-12 bg-gray-200 dark:bg-gray-700" aria-hidden />
    </>
  )
}
