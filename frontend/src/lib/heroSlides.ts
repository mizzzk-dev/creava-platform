import type { HeroSlide } from '@/components/common/HeroImageSlider'
import type { SiteSettings, StrapiMedia } from '@/types'
import { getMediaUrl } from '@/utils'

/**
 * Strapi / CMS の heroSlides JSON を想定した入力形。
 * 画像は URL 文字列 or StrapiMedia を受け付ける。
 */
export interface RawHeroSlide {
  id?: string | number
  image?: string | StrapiMedia | null
  mobileImage?: string | StrapiMedia | null
  desktopImage?: string | StrapiMedia | null
  title?: string | null
  slideTitle?: string | null
  subtitle?: string | null
  description?: string | null
  slideDescription?: string | null
  eyebrow?: string | null
  featuredLabel?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
  slideLink?: string | null
  secondaryCtaLabel?: string | null
  secondaryCtaHref?: string | null
  focalPoint?: string | null
  alt?: string | null
  imageAlt?: string | null
  overlay?: 'soft' | 'dark' | 'editorial' | 'none' | null
  overlayStyle?: string | null
  align?: 'left' | 'center' | null
  visibility?: 'public' | 'hidden' | 'draft' | boolean | null
  slideVisibility?: 'public' | 'hidden' | 'draft' | boolean | null
  slideOrder?: number | null
  order?: number | null
  locale?: string | null
}

function resolveImageUrl(input?: string | StrapiMedia | null, size?: 'medium' | 'large'): string | null {
  if (!input) return null
  if (typeof input === 'string') return input
  if ('url' in input) {
    return getMediaUrl(input, size)
  }
  return null
}

function resolveOverlay(value?: string | null): HeroSlide['overlay'] {
  if (value === 'soft' || value === 'dark' || value === 'editorial' || value === 'none') return value
  return 'soft'
}

function isVisible(raw: RawHeroSlide): boolean {
  const v = raw.slideVisibility ?? raw.visibility
  if (v == null) return true
  if (typeof v === 'boolean') return v
  return v === 'public'
}

/**
 * CMS から受け取った raw slide 配列を HeroSlide 配列に正規化する。
 * - 非公開スライドは除外
 * - slideOrder / order で昇順ソート
 * - フィールドの揺れを吸収
 */
export function normalizeHeroSlides(raw: unknown): HeroSlide[] {
  if (!Array.isArray(raw)) return []
  const items = raw
    .filter((entry): entry is RawHeroSlide => typeof entry === 'object' && entry !== null)
    .filter(isVisible)
    .map((entry, index) => {
      const image = resolveImageUrl(entry.image ?? entry.desktopImage, 'large')
      const mobileImage = resolveImageUrl(entry.mobileImage, 'large')
      const slide: HeroSlide = {
        id: entry.id ?? `slide-${index}`,
        image,
        mobileImage: mobileImage ?? image,
        title: entry.slideTitle ?? entry.title ?? null,
        eyebrow: entry.eyebrow ?? entry.subtitle ?? null,
        description: entry.slideDescription ?? entry.description ?? null,
        ctaLabel: entry.ctaLabel ?? null,
        ctaHref: entry.ctaHref ?? entry.slideLink ?? null,
        secondaryCtaLabel: entry.secondaryCtaLabel ?? null,
        secondaryCtaHref: entry.secondaryCtaHref ?? null,
        featuredLabel: entry.featuredLabel ?? null,
        focalPoint: entry.focalPoint ?? null,
        alt: entry.alt ?? entry.imageAlt ?? entry.slideTitle ?? entry.title ?? null,
        overlay: resolveOverlay(entry.overlay ?? entry.overlayStyle ?? null),
        align: entry.align ?? 'left',
      }
      const order = entry.slideOrder ?? entry.order
      return { slide, order: typeof order === 'number' ? order : index }
    })
    .sort((a, b) => a.order - b.order)
    .map((item) => item.slide)
  return items
}

export interface StoreHeroDefaults {
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
}

/**
 * CMS でスライドが用意されていない時のフォールバックを生成する。
 * 画像は無くてもプレースホルダで成立するようにする。
 */
export function buildStoreHeroFallbackSlides(
  settings: SiteSettings | null | undefined,
  defaults: StoreHeroDefaults,
): HeroSlide[] {
  const heroImage = resolveImageUrl(settings?.heroVisual ?? null, 'large')
  return [
    {
      id: 'store-hero-default-1',
      image: heroImage,
      mobileImage: heroImage,
      eyebrow: 'mizzz official store',
      featuredLabel: 'FEATURED',
      title: settings?.heroTitle?.trim() || defaults.title,
      description: settings?.heroCopy?.trim() || defaults.description,
      ctaLabel: settings?.heroCTALabel?.trim() || defaults.ctaLabel,
      ctaHref: settings?.heroCTAUrl?.trim() || defaults.ctaHref,
      overlay: 'editorial',
      align: 'left',
    },
  ]
}
