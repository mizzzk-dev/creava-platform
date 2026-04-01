export const SITE_NAME = 'Creava'

export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? ''

/** OGP のデフォルト画像（public/ に配置する想定） */
export const OG_DEFAULT_IMAGE = `${SITE_URL}/og-default.png`

/**
 * body テキストを OGP description 用に短縮する
 * 改行を除去して maxLen 文字で切り詰める
 */
export function truncateForDescription(text: string, maxLen = 120): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized.length > maxLen ? `${normalized.slice(0, maxLen)}…` : normalized
}
