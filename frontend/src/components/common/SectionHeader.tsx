import { Link } from 'react-router-dom'

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
        <span className="font-mono text-[10px] text-gray-300 select-none" aria-hidden="true">
          //
        </span>
        <h2 className="font-mono text-xs uppercase tracking-wider text-gray-400">{label}</h2>
      </div>

      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="font-mono text-[10px] text-gray-300 transition-colors hover:text-gray-600"
        >
          {viewAllLabel}
        </Link>
      )}
    </div>
  )
}
