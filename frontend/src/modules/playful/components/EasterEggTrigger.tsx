/**
 * EasterEggTrigger
 * N回クリックで出現するイースターエッグ演出。
 * - UXを壊さない: 何もない場所に自然に存在する
 * - 発見済みは localStorage で記憶
 * - 世界観に合わせたシンプルな表現
 */
import { useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useEasterEgg } from '../hooks/useEasterEgg'

interface Props {
  /** ユニーク ID（localStorage キーに使用） */
  id: string
  /** 発火までのクリック数 (default: 7) */
  triggerCount?: number
  /** 発見後に表示するメッセージ */
  message: string
  /** 「close」後に表示し続けるか (default: false) */
  persistAfterFound?: boolean
  location?: string
  /** トリガー要素の children */
  children: React.ReactNode
  className?: string
}

export default function EasterEggTrigger({
  id,
  triggerCount = 7,
  message,
  persistAfterFound = false,
  location = 'easter_egg',
  children,
  className = '',
}: Props) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const { found, handleClick, isClose } = useEasterEgg({ id, triggerCount, location })
  // マウント時点で既に発見済み（localStorage 由来）かどうかを記憶する。
  // persistAfterFound=false の場合、以前の訪問で発見済みのものはバブルを表示しない。
  const wasFoundOnMount = useRef(found)

  return (
    <span className={`relative inline-block select-none ${className}`}>
      <span
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
        className="cursor-default"
        aria-label={found
          ? t('playful.easterEggFoundLabel', { defaultValue: '発見済み' })
          : undefined
        }
      >
        {children}
      </span>

      {/* あと1回 — 極めて小さなヒント */}
      {isClose && !found && (
        <span
          className="pointer-events-none absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-violet-400/70"
          aria-hidden
        />
      )}

      {/* 発見演出:
          - persistAfterFound=true  → found であれば常に表示
          - persistAfterFound=false → 今セッションで発見した場合のみ表示
            （前回訪問で発見済みの場合は非表示）                */}
      <AnimatePresence>
        {found && (persistAfterFound || !wasFoundOnMount.current) && (
          <motion.span
            key="egg-found"
            initial={reduceMotion ? {} : { opacity: 0, y: -6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border border-gray-200/80 bg-white/95 px-3 py-1.5 text-[11px] text-gray-700 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-200"
            style={{ bottom: '110%' }}
            aria-live="polite"
          >
            {message}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
