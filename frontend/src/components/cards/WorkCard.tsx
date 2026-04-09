import { Link } from 'react-router-dom'
import Badge from '@/components/common/Badge'
import { useTilt } from '@/hooks/useTilt'
import type { ContentStatus } from '@/types/content'

interface Props {
  title: string
  href: string
  category?: string | null
  thumbnailUrl?: string | null
  /** コレクション番号ラベル用（0 始まり） */
  index?: number
  isFeatured?: boolean
  status?: ContentStatus
  hasCaseStudy?: boolean
}

export default function WorkCard({ title, href, category, thumbnailUrl, index, isFeatured, status, hasCaseStudy }: Props) {
  const label = index !== undefined ? String(index + 1).padStart(2, '0') : null
  const { ref, onMouseMove, onMouseLeave } = useTilt<HTMLDivElement>({ maxTilt: 8, scale: 1.015 })

  return (
    <Link to={href} className="group block outline-none" tabIndex={0}>
      <div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ── Image area ──────────────────────────── */}
        <div
          className="relative overflow-hidden bg-cyber-800 dark:bg-cyber-900"
          style={{ aspectRatio: '1 / 1' }}
        >
          {thumbnailUrl ? (
            <>
              <img
                src={thumbnailUrl}
                alt={title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              />
              {/* Overlay shimmer on hover */}
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, transparent 50%, rgba(139,92,246,0.06) 100%)',
                }}
              />
            </>
          ) : (
            <div className="cyber-grid-fine flex h-full w-full items-center justify-center opacity-60">
              {label && (
                <span className="font-mono text-[11px] text-cyan-500/30 group-hover:text-cyan-500/60 transition-colors duration-300">
                  {label}
                </span>
              )}
            </div>
          )}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,6,15,0.55)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

          {/* Cyan border glow on hover */}
          <div
            className="absolute inset-0 border border-transparent group-hover:border-cyan-500/30 transition-all duration-400"
            style={{
              boxShadow: 'inset 0 0 0 0px rgba(6,182,212,0)',
            }}
          />

          {/* Scan-line overlay on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
            <div
              className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
              style={{
                animation: 'scanline 2s linear infinite',
                top: '-100%',
              }}
            />
          </div>

          {/* Index label — top left, cyber style */}
          {label && thumbnailUrl && (
            <span className="absolute left-2.5 top-2.5 font-mono text-[9px] tracking-widest text-white/0 group-hover:text-cyan-400/70 transition-colors duration-300">
              {label}
            </span>
          )}

          {/* Badges — top right */}
          <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-1">
            {hasCaseStudy && (
              <span className="rounded-sm border border-cyan-400/40 bg-[rgba(6,182,212,0.1)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyan-400 backdrop-blur-sm">
                case
              </span>
            )}
            {isFeatured && <Badge variant="featured" />}
            {status === 'fc_only'  && <Badge variant="fc"      />}
            {status === 'limited'  && <Badge variant="limited" />}
          </div>

          {/* Corner decoration */}
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-cyan-500/0 group-hover:border-cyan-500/30 transition-all duration-400" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-cyan-500/0 group-hover:border-cyan-500/30 transition-all duration-400" />
        </div>

        {/* ── Meta ─────────────────────────────────── */}
        <div className="mt-3 space-y-1 px-0.5">
          {category && (
            <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-500/50 group-hover:text-cyan-500/80 transition-colors duration-200">
              {category}
            </span>
          )}
          <h3 className="text-sm font-medium leading-snug text-gray-800 dark:text-gray-200 group-hover:text-cyan-400 dark:group-hover:text-cyan-300 transition-colors duration-200">
            {title}
          </h3>
          {/* Animated underline */}
          <div className="h-px w-0 bg-gradient-to-r from-cyan-500/60 to-transparent group-hover:w-full transition-all duration-400 ease-out" />
        </div>
      </div>
    </Link>
  )
}
