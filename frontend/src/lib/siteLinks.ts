const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

const toAbsoluteUrl = (baseUrl: string, path: string): string => {
  const sanitizedBase = trimTrailingSlash(baseUrl)
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`
  return `${sanitizedBase}${sanitizedPath}`
}

export const SITE_TYPE = (import.meta.env.VITE_SITE_TYPE as 'main' | 'store' | 'fanclub' | undefined) ?? 'main'

export const MAIN_SITE_URL = trimTrailingSlash((import.meta.env.VITE_MAIN_SITE_URL as string | undefined) ?? 'https://mizzz.jp')
export const STORE_SITE_URL = trimTrailingSlash((import.meta.env.VITE_STORE_SITE_URL as string | undefined) ?? 'https://store.mizzz.jp')
export const FANCLUB_SITE_URL = trimTrailingSlash((import.meta.env.VITE_FANCLUB_SITE_URL as string | undefined) ?? 'https://fc.mizzz.jp')

export const isMainSite = SITE_TYPE === 'main'
export const isStoreSite = SITE_TYPE === 'store'
export const isFanclubSite = SITE_TYPE === 'fanclub'

export const isAbsoluteUrl = (to: string): boolean => /^https?:\/\//.test(to)

export const storeLink = (path = '/store'): string => {
  const nextPath = path === '/store' ? '/' : path
  if (isStoreSite) return nextPath
  return toAbsoluteUrl(STORE_SITE_URL, nextPath)
}

export const fanclubLink = (path = '/fanclub'): string => {
  const nextPath = path === '/fanclub' ? '/' : path
  if (isFanclubSite) return nextPath
  return toAbsoluteUrl(FANCLUB_SITE_URL, nextPath)
}

export const mainLink = (path = '/'): string => {
  if (isMainSite) return path
  return toAbsoluteUrl(MAIN_SITE_URL, path)
}

export const legacyStoreRedirectTo = (pathname: string, search: string): string => {
  const suffix = pathname.startsWith('/store') ? pathname.slice('/store'.length) : pathname
  const nextPath = suffix.length > 0 ? `/store${suffix}` : '/store'
  return toAbsoluteUrl(STORE_SITE_URL, `${nextPath}${search}`)
}

export const legacyFanclubRedirectTo = (pathname: string, search: string): string => {
  const suffix = pathname.startsWith('/fanclub') ? pathname.slice('/fanclub'.length) : pathname
  const nextPath = suffix.length > 0 ? `/fanclub${suffix}` : '/fanclub'
  return toAbsoluteUrl(FANCLUB_SITE_URL, `${nextPath}${search}`)
}
