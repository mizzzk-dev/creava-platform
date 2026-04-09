import { motion, useReducedMotion } from 'framer-motion'
import { motionPresets } from '@/components/common/motionPresets'

interface BrandIllustrationProps {
  variant?: 'store' | 'fanclub' | 'limited' | 'support'
  className?: string
}

const VARIANT_TONE = {
  store: {
    primary: 'fill-violet-500/30 dark:fill-violet-400/25',
    secondary: 'fill-indigo-400/25 dark:fill-indigo-300/20',
    stroke: 'stroke-violet-600/70 dark:stroke-violet-300/70',
  },
  fanclub: {
    primary: 'fill-fuchsia-500/30 dark:fill-fuchsia-400/25',
    secondary: 'fill-sky-400/25 dark:fill-sky-300/20',
    stroke: 'stroke-fuchsia-600/70 dark:stroke-fuchsia-300/70',
  },
  limited: {
    primary: 'fill-amber-500/30 dark:fill-amber-400/30',
    secondary: 'fill-rose-400/25 dark:fill-rose-300/20',
    stroke: 'stroke-amber-600/70 dark:stroke-amber-300/70',
  },
  support: {
    primary: 'fill-emerald-500/30 dark:fill-emerald-400/25',
    secondary: 'fill-cyan-400/25 dark:fill-cyan-300/20',
    stroke: 'stroke-emerald-600/70 dark:stroke-emerald-300/70',
  },
} as const

export default function BrandIllustration({ variant = 'store', className }: BrandIllustrationProps) {
  const tone = VARIANT_TONE[variant]
  const reduceMotion = useReducedMotion()

  return (
    <div className={`pointer-events-none relative aspect-[5/4] w-full overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-white/70 via-white/30 to-white/10 backdrop-blur-sm dark:border-white/10 dark:from-white/10 dark:via-white/5 dark:to-transparent ${className ?? ''}`}>
      <motion.div
        className={`absolute -left-8 top-4 h-36 w-36 rounded-full blur-2xl ${tone.primary}`}
        variants={motionPresets.illustrationFloatSoft}
        initial="rest"
        animate={reduceMotion ? 'rest' : 'animate'}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={`absolute -bottom-10 right-4 h-40 w-40 rounded-full blur-2xl ${tone.secondary}`}
        animate={reduceMotion ? undefined : { x: [0, -12, 0], y: [0, 12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg viewBox="0 0 300 220" className="absolute inset-0 h-full w-full" role="img" aria-label="decorative mizzz illustration">
        <path d="M30 148c24-43 66-73 118-81 38-5 78 6 121 33" className={`fill-none stroke-[1.5] ${tone.stroke}`} />
        <path d="M55 169c40-18 72-25 120-18 35 5 59 15 93 36" className={`fill-none stroke-[1.2] opacity-80 ${tone.stroke}`} />
        <path d="M84 56c16-21 35-29 58-24 22 5 39 22 50 42" className={`fill-none stroke-[1.2] opacity-70 ${tone.stroke}`} />
        <circle cx="96" cy="78" r="8" className={tone.primary} />
        <circle cx="214" cy="74" r="11" className={tone.secondary} />
        <circle cx="167" cy="122" r="5" className="fill-white/60 dark:fill-white/30" />
      </svg>

      <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/50 bg-white/65 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-gray-900/65">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-600 dark:text-gray-300">mizzz visual motif</p>
        <p className="mt-1 text-xs text-gray-700 dark:text-gray-200">静けさと躍動の中間を表現する、共通ビジュアルエレメント。</p>
      </div>
    </div>
  )
}
