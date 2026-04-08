import type { ContentStatus, UserRole } from '@/types'

/**
 * コンテンツの表示可否を判定する共通関数
 *
 * 表示制御ルール:
 * - public    → 全員閲覧可
 * - fc_only   → member 以上
 * - limited   → 期限内なら全員、期限後は archiveVisibleForFC に従う
 */
export function canViewContent({
  status,
  role,
  limitedEndAt,
  archiveVisibleForFC,
}: {
  status: ContentStatus
  role: UserRole
  limitedEndAt: string | null
  archiveVisibleForFC: boolean
}): boolean {
  if (status === 'public') return true

  if (status === 'fc_only') {
    return role === 'member' || role === 'premium' || role === 'admin'
  }

  if (status === 'limited') {
    const now = new Date()
    const endAt = limitedEndAt ? new Date(limitedEndAt) : null

    if (!endAt || now <= endAt) {
      // 期限内 → 全員閲覧可
      return true
    }

    // 期限後
    if (archiveVisibleForFC) {
      return role === 'member' || role === 'premium' || role === 'admin'
    }

    return false
  }

  return false
}

/**
 * スラッグを URL セーフな文字列に変換する
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

/**
 * ISO 日付文字列を表示用にフォーマットする
 */
export function formatDate(isoString: string, locale: string = 'ja-JP'): string {
  return new Date(isoString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Shopify の価格文字列を表示用にフォーマットする
 */
export function formatPrice(amount: string, currencyCode: string): string {
  const num = parseFloat(amount)
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
  }).format(num)
}

/**
 * 数値価格を表示用にフォーマットする（Strapi / Stripe + BASE 向け）
 */
export function formatPriceNum(price: number, currencyCode: string = 'JPY'): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
  }).format(price)
}

/**
 * Strapi Media オブジェクトから表示用 URL を取得する
 *
 * - Strapi Cloud: url は絶対 URL のためそのまま返す
 * - ローカル Strapi: url は `/uploads/...` 形式なので VITE_STRAPI_API_URL を付与する
 */
export function getMediaUrl(
  media: { url: string; formats?: Record<string, { url: string }> | null } | null | undefined,
  size?: 'thumbnail' | 'small' | 'medium' | 'large',
): string | null {
  if (!media) return null

  if (size) {
    const fmt = media.formats?.[size]
    if (fmt?.url) {
      return resolveUrl(fmt.url)
    }
  }

  return resolveUrl(media.url)
}

function resolveUrl(url: string): string {
  if (url.startsWith('http')) return url
  const base = (import.meta.env.VITE_STRAPI_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''
  return base ? `${base}${url}` : url
}
