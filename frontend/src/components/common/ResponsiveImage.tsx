import { useMemo } from 'react'

type FocalPoint = 'center' | 'top' | 'bottom' | 'left' | 'right' | string

interface Props {
  /** デスクトップ向け画像 URL。空の場合はフォールバックのみ表示される。 */
  src?: string | null
  /** モバイル向け画像 URL（幅 <= mobileMaxWidth のときに優先使用）。 */
  mobileSrc?: string | null
  /** 代替テキスト。CMS の imageAlt 由来。 */
  alt?: string | null
  /** アスペクト比（例: '16/9'、'4/5'、'3/4'、'1/1'）。CLS 防止のため必須扱い。 */
  aspectRatio?: string
  /** モバイル時のアスペクト比。指定がない場合は aspectRatio を使用。 */
  mobileAspectRatio?: string
  /** 画像の object-fit focal point。CMS 設定 or 'center' 既定。 */
  focalPoint?: FocalPoint
  /** 追加クラス。 */
  className?: string
  /** モバイル切り替え閾値（px）。既定 768。 */
  mobileMaxWidth?: number
  /** ヒーローなど LCP に効く画像のみ true。 */
  priority?: boolean
  /** フェッチ優先度。priority が true の場合は 'high'。 */
  fetchPriority?: 'high' | 'low' | 'auto'
  /** decoding 方式。既定 async。 */
  decoding?: 'async' | 'sync' | 'auto'
  /** フォールバック背景クラス（画像が無いときのプレースホルダ装飾）。 */
  fallbackClassName?: string
  /** フォールバック時に重ねる子要素（文字入りプレースホルダなど）。 */
  fallback?: React.ReactNode
  /** sizes 属性（responsive srcset を最適化したい場合）。 */
  sizes?: string
  /** style 上書き。 */
  style?: React.CSSProperties
}

/**
 * ブランド全体で共通利用する画像表示コンポーネント。
 *
 * - desktop / mobile で picture source を切替
 * - CMS 未設定時はフォールバックを表示（デザイン崩れ防止）
 * - aspect-ratio を必ず保持して CLS を抑制
 * - focal point で構図調整
 * - priority 以外は loading='lazy' で遅延読込
 */
export default function ResponsiveImage({
  src,
  mobileSrc,
  alt,
  aspectRatio = '16/9',
  mobileAspectRatio,
  focalPoint = 'center',
  className = '',
  mobileMaxWidth = 768,
  priority = false,
  fetchPriority,
  decoding = 'async',
  fallbackClassName = '',
  fallback,
  sizes,
  style,
}: Props) {
  const hasImage = Boolean(src || mobileSrc)
  const resolvedFetchPriority = fetchPriority ?? (priority ? 'high' : 'auto')
  const loading = priority ? 'eager' : 'lazy'
  const objectPosition = useMemo(() => {
    if (!focalPoint || focalPoint === 'center') return '50% 50%'
    if (focalPoint === 'top') return '50% 15%'
    if (focalPoint === 'bottom') return '50% 85%'
    if (focalPoint === 'left') return '15% 50%'
    if (focalPoint === 'right') return '85% 50%'
    return focalPoint
  }, [focalPoint])

  const containerStyle: React.CSSProperties = {
    aspectRatio,
    ...(mobileAspectRatio
      ? ({ ['--ri-aspect-mobile' as string]: mobileAspectRatio } as React.CSSProperties)
      : {}),
    ...style,
  }

  return (
    <div
      className={`relative overflow-hidden ${mobileAspectRatio ? 'ri-aspect' : ''} ${className}`}
      style={containerStyle}
    >
      {!hasImage && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 text-gray-300 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 dark:text-white/10 ${fallbackClassName}`}
        >
          {fallback ?? (
            <span className="font-mono text-[10px] uppercase tracking-[0.3em]">no image</span>
          )}
        </div>
      )}
      {hasImage && (
        <picture>
          {mobileSrc && (
            <source media={`(max-width: ${mobileMaxWidth}px)`} srcSet={mobileSrc} />
          )}
          <img
            src={src ?? mobileSrc ?? ''}
            alt={alt ?? ''}
            loading={loading}
            decoding={decoding}
            fetchPriority={resolvedFetchPriority}
            sizes={sizes}
            className="absolute inset-0 h-full w-full select-none object-cover"
            style={{ objectPosition }}
            draggable={false}
          />
        </picture>
      )}
    </div>
  )
}
