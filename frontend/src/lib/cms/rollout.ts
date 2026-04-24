import type { CmsProvider } from './types'

const WORDPRESS_ENDPOINT_MAP: Record<string, string> = {
  '/blog-posts': 'blog',
  '/news-items': 'news',
  '/events': 'events',
  '/works': 'works',
  '/store-products': 'store',
  '/fanclub-contents': 'fanclub',
  '/site-setting': 'settings',
}

function toBool(value: string | undefined): boolean {
  return value === '1' || value === 'true'
}

function isWordPressPrimary(): boolean {
  return import.meta.env.VITE_CMS_PROVIDER === 'wordpress'
}

export function resolveProviderForEndpoint(endpoint: string): CmsProvider {
  if (!isWordPressPrimary()) return 'strapi'

  const siteType = import.meta.env.VITE_SITE_TYPE ?? 'main'
  const key = WORDPRESS_ENDPOINT_MAP[endpoint]
  if (!key) return 'strapi'

  const globalEnabled = toBool(import.meta.env.VITE_CMS_WORDPRESS_ROLLOUT_ENABLED)
  if (!globalEnabled) return 'strapi'

  const contentTypeEnabled = toBool((import.meta as ImportMeta & { env: Record<string, string | undefined> }).env[`VITE_CMS_WORDPRESS_ROLLOUT_${key.toUpperCase()}`])
  if (!contentTypeEnabled) return 'strapi'

  const siteScopedEnabled = toBool((import.meta as ImportMeta & { env: Record<string, string | undefined> }).env[`VITE_CMS_WORDPRESS_ROLLOUT_SITE_${siteType.toUpperCase()}`])
  if (!siteScopedEnabled) return 'strapi'

  return 'wordpress'
}
