import { SITE_TYPE } from '@/lib/siteLinks'

export const AUTH_PROVIDER = (import.meta.env.VITE_AUTH_PROVIDER?.trim() ?? 'logto') as 'logto' | 'supabase'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
export const SUPABASE_OAUTH_DEFAULT_PROVIDER = import.meta.env.VITE_SUPABASE_OAUTH_DEFAULT_PROVIDER?.trim() ?? 'google'
export const SUPABASE_PROJECT_REF = import.meta.env.VITE_SUPABASE_PROJECT_REF?.trim() ?? ''

export const LOGTO_ENDPOINT = import.meta.env.VITE_LOGTO_ENDPOINT?.trim() ?? ''
const LOGTO_APP_ID_UNIFIED = import.meta.env.VITE_LOGTO_APP_ID_UNIFIED?.trim() ?? ''
const LOGTO_APP_ID_MAIN = import.meta.env.VITE_LOGTO_APP_ID_MAIN?.trim() ?? ''
const LOGTO_APP_ID_STORE = import.meta.env.VITE_LOGTO_APP_ID_STORE?.trim() ?? ''
const LOGTO_APP_ID_FC = import.meta.env.VITE_LOGTO_APP_ID_FC?.trim() ?? ''
const LOGTO_APP_ID_LEGACY = import.meta.env.VITE_LOGTO_APP_ID?.trim() ?? ''
export const LOGTO_CALLBACK_PATH = import.meta.env.VITE_LOGTO_CALLBACK_PATH?.trim() || '/callback'
export const LOGTO_POST_LOGOUT_REDIRECT_URI = import.meta.env.VITE_LOGTO_POST_LOGOUT_REDIRECT_URI?.trim() ?? ''
export const LOGTO_API_RESOURCE = import.meta.env.VITE_LOGTO_API_RESOURCE?.trim() ?? ''
export const LOGTO_ISSUER = import.meta.env.VITE_LOGTO_ISSUER?.trim() ?? ''
export const LOGTO_MANAGEMENT_API_ENDPOINT = import.meta.env.VITE_LOGTO_MANAGEMENT_API_ENDPOINT?.trim() ?? ''
export const LOGTO_ACCOUNT_CENTER_URL = import.meta.env.VITE_LOGTO_ACCOUNT_CENTER_URL?.trim() ?? ''

function resolveAppIdBySiteType(): string {
  if (LOGTO_APP_ID_UNIFIED) return LOGTO_APP_ID_UNIFIED
  if (SITE_TYPE === 'main') return LOGTO_APP_ID_MAIN || LOGTO_APP_ID_LEGACY
  if (SITE_TYPE === 'store') return LOGTO_APP_ID_STORE || LOGTO_APP_ID_LEGACY
  return LOGTO_APP_ID_FC || LOGTO_APP_ID_LEGACY
}

export const LOGTO_APP_ID = resolveAppIdBySiteType()
export const HAS_LOGTO = Boolean(LOGTO_ENDPOINT && LOGTO_APP_ID)
export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
export const HAS_AUTH = AUTH_PROVIDER === 'supabase' ? HAS_SUPABASE : HAS_LOGTO

export function resolveLogtoCallbackUrl(): string {
  return new URL(LOGTO_CALLBACK_PATH, window.location.origin).toString()
}

export function resolvePostLogoutRedirectUrl(): string {
  if (AUTH_PROVIDER === 'supabase') {
    return window.location.origin
  }
  if (LOGTO_POST_LOGOUT_REDIRECT_URI) return LOGTO_POST_LOGOUT_REDIRECT_URI
  return window.location.origin
}

function toAbsoluteUrlOrNull(url: string): URL | null {
  if (!url) return null
  try {
    return new URL(url)
  } catch {
    return null
  }
}

export function resolveAccountCenterUrl(path?: string): string | null {
  if (AUTH_PROVIDER === 'supabase' && SUPABASE_PROJECT_REF) {
    const base = toAbsoluteUrlOrNull(`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/users`)
    if (!base) return null
    return base.toString()
  }

  const rawBase = LOGTO_ACCOUNT_CENTER_URL || `${LOGTO_ENDPOINT}/account-center`
  const base = toAbsoluteUrlOrNull(rawBase)
  if (!base) return null
  if (!path) return base.toString()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return new URL(normalizedPath, base).toString()
}
