import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import ResponsiveImage from '@/components/common/ResponsiveImage'

interface Props {
  /** リンク先 URL（内部 / 外部どちらも可）。 */
  href: string
  /** 画像 URL。 */
  image?: string | null
  /** モバイル向け画像 URL。 */
  mobileImage?: string | null
  /** 代替テキスト。 */
  alt?: string | null
  /** 小見出し（SEASON / LIMITED など）。 */
  eyebrow?: string | null
  /** メインタイトル。 */
  title: string
  /** 説明文。 */
  description?: string | null
  /** CTA ラベル。 */
  ctaLabel?: string | null
  /** 画像の focal point。 */
  focalPoint?: string | null
  /** アスペクト比。 */
  aspectRatio?: string
  mobileAspectRatio?: string
  /** レイアウト。editorial は大きく、card はコンパクト。 */
  variant?: 'editorial' | 'card' | 'compact'
  /** テーマトーン。 */
  tone?: 'default' | 'member' | 'campaign' | 'accent'
  /** external リンク（target=_blank） */
  external?: boolean
  /** クリック時のコールバック（計測用）。 */
  onClick?: () => void
  /** 追加クラス。 */
  className?: string
}

const TONE_ACCENT: Record<NonNullable<Props['tone']>, string> = {
  default: 'text-white',
  member: 'text-violet-200',
  campaign: 'text-amber-200',
  accent: 'text-cyan-200',
}

const TONE_BORDER: Record<NonNullable<Props['tone']>, string> = {
  default: 'border-gray-200/80 dark:border-white/10',
  member: 'border-violet-200/70 dark:border-violet-500/20',
  campaign: 'border-amber-200/70 dark:border-amber-500/20',
  accent: 'border-cyan-200/70 dark:border-cyan-500/20',
}

/**
 * 画像主体の特集 / ピックアップ / キャンペーン導線カード。
 *
 * - editorial: 大判（2カラム相当）
 * - card: 標準カード
 * - compact: 画像は小さめ
 */
export default function ImageFeatureTile({
  href,
  image,
  mobileImage,
  alt,
  eyebrow,
  title,
  description,
  ctaLabel,
  focalPoint,
  aspectRatio,
  mobileAspectRatio,
  variant = 'card',
  tone = 'default',
  external,
  onClick,
  className = '',
}: Props) {
  const reduceMotion = useReducedMotion()
  const ratio = aspectRatio ?? (variant === 'editorial' ? '16/9' : variant === 'compact' ? '4/3' : '4/3')
  const mobileRatio = mobileAspectRatio ?? (variant === 'editorial' ? '4/5' : '4/3')

  const content = (
    <div
      className={`group relative block overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-gray-950/60 ${TONE_BORDER[tone]} ${className}`}
    >
      <div className="relative">
        <motion.div
          initial={{ scale: 1 }}
          whileHover={reduceMotion ? {} : { scale: 1.04 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <ResponsiveImage
            src={image ?? null}
            mobileSrc={mobileImage ?? image ?? null}
            alt={alt ?? title}
            aspectRatio={ratio}
            mobileAspectRatio={mobileRatio}
            focalPoint={focalPoint ?? 'center'}
            className="h-full w-full"
          />
        </motion.div>

        {/* gradient overlay (image readability) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-95"
        />

        {/* caption */}
        <div className="absolute inset-x-0 bottom-0 space-y-1 px-5 pb-5 sm:px-6 sm:pb-6">
          {eyebrow && (
            <p className={`font-mono text-[10px] uppercase tracking-[0.2em] ${TONE_ACCENT[tone]}`}>
              {eyebrow}
            </p>
          )}
          <h3 className="font-display text-lg font-semibold leading-tight text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)] sm:text-xl">
            {title}
          </h3>
          {description && variant === 'editorial' && (
            <p className="line-clamp-2 max-w-md text-sm leading-relaxed text-white/85">{description}</p>
          )}
          {ctaLabel && (
            <p className="pt-1 font-mono text-[11px] uppercase tracking-widest text-white/80 transition-colors group-hover:text-white">
              {ctaLabel} <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
            </p>
          )}
        </div>
      </div>

      {/* description body for card variant */}
      {description && variant !== 'editorial' && (
        <p className="px-5 py-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400 sm:text-sm">
          {description}
        </p>
      )}
    </div>
  )

  if (external) {
    return (
      <a href={href} onClick={onClick} target="_blank" rel="noreferrer" className="block">
        {content}
      </a>
    )
  }
  return (
    <Link to={href} onClick={onClick} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80">
      {content}
    </Link>
  )
}
