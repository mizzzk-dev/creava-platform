import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface Props {
  label: string
  viewAllTo?: string
  viewAllLabel?: string
}

/**
 * 共通セクションヘッダー
 * // prefix + モノスペースラベル + "all →" リンク
 *
 * 使用例:
 *   <SectionHeader label="Works" viewAllTo="/works" />
 */
export default function SectionHeader({ label, viewAllTo, viewAllLabel = 'all →' }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-cyan-500/30 select-none" aria-hidden="true">
          //
        </span>
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-[rgba(180,190,220,0.5)]">
          {label}
        </h2>
      </div>

      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="group inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cyan-500/40 transition-colors hover:text-cyan-400"
        >
          {viewAllLabel}
          <motion.span
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block"
          >
            →
          </motion.span>
        </Link>
      )}
    </div>
  )
}
