import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import ResponsiveImage from '@/components/common/ResponsiveImage'

export interface HeroSlide {
  /** 安定キー。 */
  id: string | number
  /** デスクトップ画像 URL。 */
  image?: string | null
  /** モバイル画像 URL（未指定時は desktop をフォールバック）。 */
  mobileImage?: string | null
  /** メインコピー。 */
  title?: string | null
  /** 上部 eyebrow（小見出し）。 */
  eyebrow?: string | null
  /** サブコピー。 */
  description?: string | null
  /** CTA ラベル。 */
  ctaLabel?: string | null
  /** CTA 遷移先 URL。 */
  ctaHref?: string | null
  /** 追加の CTA（セカンダリ）。 */
  secondaryCtaLabel?: string | null
  secondaryCtaHref?: string | null
  /** Featured ラベル（LIMITED / DROP など）。 */
  featuredLabel?: string | null
  /** 画像の focal point（CMS から指定可能）。 */
  focalPoint?: string | null
  /** alt テキスト。 */
  alt?: string | null
  /** overlay テーマ。 */
  overlay?: 'soft' | 'dark' | 'editorial' | 'none'
  /** コピー配置。 */
  align?: 'left' | 'center'
}

interface Props {
  slides: HeroSlide[]
  /** 自動再生間隔（ms）。0 以下で停止。既定 5200ms。 */
  autoplayInterval?: number
  /** 一時停止時間（手動操作後）。既定 8000ms。 */
  pauseAfterInteractionMs?: number
  /** アスペクト比（desktop）。 */
  aspectRatio?: string
  /** モバイル時のアスペクト比。 */
  mobileAspectRatio?: string
  /** 画像 subtle zoom を有効化。 */
  kenBurns?: boolean
  /** CTA クリック時のコールバック。 */
  onCtaClick?: (slideIndex: number, kind: 'primary' | 'secondary') => void
  /** analytics location タグ。 */
  locationTag?: string
  /** 追加クラス。 */
  className?: string
  /** スライドを縦方向にクリップするか（角丸を適用する）。 */
  rounded?: boolean
}

const OVERLAY_CLASSES: Record<NonNullable<HeroSlide['overlay']>, string> = {
  soft: 'bg-gradient-to-t from-black/55 via-black/25 to-black/10',
  dark: 'bg-gradient-to-t from-black/75 via-black/45 to-black/20',
  editorial: 'bg-gradient-to-br from-black/55 via-black/20 to-transparent',
  none: 'bg-transparent',
}

/**
 * ヒーロー用の画像スライダー。
 *
 * - 画像差し替えしやすい（props 中心 / 空スライドにフォールバック）
 * - 自動再生、ホバー/フォーカス/reduce-motion で一時停止
 * - desktop / mobile の異なる画像を出し分け
 * - fade + subtle zoom で上品な切り替え
 * - キーボード操作（←→）とインジケータ対応
 */
export default function HeroImageSlider(props: Props) {
  const {
    slides,
    autoplayInterval = 5200,
    pauseAfterInteractionMs = 8000,
    aspectRatio = '16/9',
    mobileAspectRatio = '4/5',
    onCtaClick,
    locationTag,
    className = '',
    rounded = true,
  } = props

  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const pauseTimerRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const safeSlides = useMemo(() => (slides?.length ? slides : [createEmptySlide()]), [slides])

  const goTo = useCallback(
    (next: number) => {
      const len = safeSlides.length
      if (len <= 0) return
      const normalized = ((next % len) + len) % len
      setIndex(normalized)
    },
    [safeSlides.length],
  )

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  const pauseAutoplay = useCallback(() => {
    setIsPaused(true)
    if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current)
    pauseTimerRef.current = window.setTimeout(() => setIsPaused(false), pauseAfterInteractionMs)
  }, [pauseAfterInteractionMs])

  useEffect(() => {
    if (reduceMotion) return
    if (isPaused) return
    if (safeSlides.length <= 1) return
    if (autoplayInterval <= 0) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeSlides.length)
    }, autoplayInterval)
    return () => window.clearInterval(id)
  }, [autoplayInterval, isPaused, reduceMotion, safeSlides.length])

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (event: KeyboardEvent) => {
      if (!el.contains(document.activeElement)) return
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        next()
        pauseAutoplay()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        prev()
        pauseAutoplay()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev, pauseAutoplay])

  const activeSlide = safeSlides[index] ?? safeSlides[0]

  return (
    <div
      ref={containerRef}
      className={`relative isolate w-full ${rounded ? 'overflow-hidden rounded-3xl' : 'overflow-hidden'} ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label={locationTag ?? 'hero-slider'}
    >
      <div
        className="relative w-full"
        style={{
          aspectRatio,
          ['--hs-aspect-mobile' as string]: mobileAspectRatio,
        } as React.CSSProperties}
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
            aria-roledescription="slide"
            aria-label={activeSlide.title ?? `slide ${index + 1}`}
          >
            <motion.div
              initial={{ scale: reduceMotion ? 1 : 1.06 }}
              animate={{ scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : 7.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <ResponsiveImage
                src={activeSlide.image ?? null}
                mobileSrc={activeSlide.mobileImage ?? activeSlide.image ?? null}
                alt={activeSlide.alt ?? activeSlide.title ?? ''}
                aspectRatio={aspectRatio}
                mobileAspectRatio={mobileAspectRatio}
                focalPoint={activeSlide.focalPoint ?? 'center'}
                priority={index === 0}
                fallbackClassName="bg-gradient-to-br from-indigo-100 via-white to-cyan-100 dark:from-indigo-950/40 dark:via-[#0a0a1a] dark:to-cyan-950/30"
                fallback={
                  <div className="flex flex-col items-center gap-2 opacity-60">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-gray-400 dark:text-white/40">
                      visual placeholder
                    </span>
                    <span className="font-display text-3xl font-black text-gray-200 dark:text-white/10">mizzz</span>
                  </div>
                }
                className="h-full w-full"
              />
            </motion.div>

            {/* overlay for readability */}
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 ${OVERLAY_CLASSES[activeSlide.overlay ?? 'soft']}`}
            />

            {/* caption block */}
            <SlideCaption
              slide={activeSlide}
              onCtaClick={(kind) => onCtaClick?.(index, kind)}
            />
          </motion.div>
        </AnimatePresence>

        {/* controls */}
        {safeSlides.length > 1 && (
          <>
            <SliderArrow
              direction="prev"
              onClick={() => {
                prev()
                pauseAutoplay()
              }}
            />
            <SliderArrow
              direction="next"
              onClick={() => {
                next()
                pauseAutoplay()
              }}
            />
          </>
        )}
      </div>

      {safeSlides.length > 1 && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5 sm:bottom-5">
          {safeSlides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`スライド ${i + 1} へ移動`}
              aria-current={i === index}
              onClick={() => {
                goTo(i)
                pauseAutoplay()
              }}
              className={`group h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? 'w-8 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)]'
                  : 'w-3 bg-white/55 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function createEmptySlide(): HeroSlide {
  return {
    id: 'empty',
    image: null,
    mobileImage: null,
    title: null,
    description: null,
    ctaLabel: null,
    ctaHref: null,
    overlay: 'soft',
    align: 'left',
  }
}

function SliderArrow({ direction, onClick }: { direction: 'prev' | 'next'; onClick: () => void }) {
  const isPrev = direction === 'prev'
  return (
    <button
      type="button"
      aria-label={isPrev ? '前のスライド' : '次のスライド'}
      onClick={onClick}
      className={`group absolute top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 p-2 text-white backdrop-blur-sm transition-all hover:border-white/55 hover:bg-black/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:inline-flex ${
        isPrev ? 'left-3 sm:left-5' : 'right-3 sm:right-5'
      }`}
    >
      <span aria-hidden className="text-lg leading-none">
        {isPrev ? '‹' : '›'}
      </span>
    </button>
  )
}

function SlideCaption({
  slide,
  onCtaClick,
}: {
  slide: HeroSlide
  onCtaClick?: (kind: 'primary' | 'secondary') => void
}) {
  const alignClass =
    slide.align === 'center'
      ? 'items-center justify-center text-center'
      : 'items-start justify-end text-left'
  return (
    <div className={`absolute inset-0 z-[1] flex flex-col ${alignClass} px-5 py-8 sm:px-10 sm:py-12 md:px-14 md:py-16`}>
      <div className="max-w-2xl space-y-4">
        {slide.eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/90 backdrop-blur-sm">
            {slide.featuredLabel && (
              <span className="inline-flex items-center gap-1 text-amber-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-300" />
                </span>
                {slide.featuredLabel}
              </span>
            )}
            <span>{slide.eyebrow}</span>
          </span>
        )}
        {slide.title && (
          <h2 className="font-display text-balance text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] sm:text-4xl md:text-[52px]">
            {slide.title}
          </h2>
        )}
        {slide.description && (
          <p className="max-w-xl text-sm leading-relaxed text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] sm:text-base">
            {slide.description}
          </p>
        )}
        {(slide.ctaHref || slide.secondaryCtaHref) && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {slide.ctaHref && slide.ctaLabel && (
              <a
                href={slide.ctaHref}
                onClick={() => onCtaClick?.('primary')}
                className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-lg shadow-black/30 transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              >
                {slide.ctaLabel}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
            )}
            {slide.secondaryCtaHref && slide.secondaryCtaLabel && (
              <a
                href={slide.secondaryCtaHref}
                onClick={() => onCtaClick?.('secondary')}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm transition-all hover:border-white/55 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                {slide.secondaryCtaLabel} →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
