/**
 * SectionReveal
 *
 * スクロール連動のセクション入場アニメーション。
 * IntersectionObserver (whileInView) ベースで once=true。
 * prefers-reduced-motion を尊重し、reduceMotion 時は即表示。
 *
 * variant:
 *   fadeUp    — デフォルト: フェード + 上昇
 *   blur      — ブラー → シャープ (editorial)
 *   slideLeft — 左スライド
 *   scaleIn   — 縮小 → 等倍
 *   clip      — クリップパス: 下から幕が開く (cinematic)
 *   rise      — 深めのリフト + スケール (hero 向け)
 */

import type { PropsWithChildren } from 'react'
import type { Variants } from 'framer-motion'
import { motion, useReducedMotion } from 'framer-motion'
import { useSeasonalTheme } from '@/modules/seasonal/context'

type RevealVariant = 'fadeUp' | 'blur' | 'slideLeft' | 'scaleIn' | 'clip' | 'rise'

interface SectionRevealProps extends PropsWithChildren {
  className?: string
  delay?: number
  variant?: RevealVariant
  /** amount: 何割見えたら発火 (0–1) default 0.12 */
  amount?: number
}

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]
const EASE_SMOOTH: [number, number, number, number] = [0.4, 0, 0.2, 1]

export default function SectionReveal({
  children,
  className,
  delay = 0,
  variant = 'fadeUp',
  amount = 0.12,
}: SectionRevealProps) {
  const reduceMotion = useReducedMotion()
  const { config } = useSeasonalTheme()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  /* duration & offset を季節テーマで微調整 */
  const isSoft    = config.scrollPreset === 'soft'
  const isDramatic = config.scrollPreset === 'dramatic'
  const baseDur   = isSoft ? 0.7 : isDramatic ? 0.55 : 0.55
  const offset    = isDramatic ? 28 : 18

  const variantMap: Record<RevealVariant, Variants> = {
    fadeUp: {
      hidden:  { opacity: 0, y: offset },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: baseDur, ease: EASE_OUT, delay },
      },
    },
    blur: {
      hidden:  { opacity: 0, y: offset * 0.7, filter: 'blur(6px)' },
      visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: baseDur + 0.08, ease: EASE_SMOOTH, delay },
      },
    },
    slideLeft: {
      hidden:  { opacity: 0, x: -24 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: baseDur, ease: EASE_OUT, delay },
      },
    },
    scaleIn: {
      hidden:  { opacity: 0, scale: 0.94 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: baseDur, ease: EASE_OUT, delay },
      },
    },
    /** clip — 下から幕が開くシネマティック入場 */
    clip: {
      hidden:  {
        opacity: 0,
        y: offset + 8,
        clipPath: 'inset(100% 0% 0% 0%)',
      },
      visible: {
        opacity: 1,
        y: 0,
        clipPath: 'inset(0% 0% 0% 0%)',
        transition: {
          duration: baseDur + 0.15,
          ease: EASE_OUT,
          delay,
        },
      },
    },
    /** rise — 深めのリフト + スケール (ヒーロー向け) */
    rise: {
      hidden:  { opacity: 0, y: 40, scale: 0.96 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: baseDur + 0.1,
          ease: EASE_OUT,
          delay,
        },
      },
    },
  }

  const chosen = variantMap[variant]

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={chosen}
    >
      {children}
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────
   SectionRevealGroup — 子要素をスタガー付きで入場させる
   例:
     <SectionRevealGroup>
       <div>card 1</div>
       <div>card 2</div>
     </SectionRevealGroup>
───────────────────────────────────────────────────── */

interface SectionRevealGroupProps extends PropsWithChildren {
  className?: string
  stagger?: number
  delay?: number
  childVariant?: RevealVariant
}

export function SectionRevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  childVariant = 'fadeUp',
}: SectionRevealGroupProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  const containerVariants = {
    hidden:  {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  }

  const itemVariants: Record<RevealVariant, Variants> = {
    fadeUp:    { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } } },
    blur:      { hidden: { opacity: 0, y: 12, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: EASE_SMOOTH } } },
    slideLeft: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE_OUT } } },
    scaleIn:   { hidden: { opacity: 0, scale: 0.94 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: EASE_OUT } } },
    clip:      { hidden: { opacity: 0, y: 20, clipPath: 'inset(100% 0% 0% 0%)' }, visible: { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.6, ease: EASE_OUT } } },
    rise:      { hidden: { opacity: 0, y: 32, scale: 0.96 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: EASE_OUT } } },
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
      variants={containerVariants}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={itemVariants[childVariant]}>
              {child}
            </motion.div>
          ))
        : (
          <motion.div variants={itemVariants[childVariant]}>
            {children}
          </motion.div>
        )
      }
    </motion.div>
  )
}
