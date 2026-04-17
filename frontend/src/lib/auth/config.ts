export const LOGTO_ENDPOINT = import.meta.env.VITE_LOGTO_ENDPOINT?.trim() ?? ''
export const LOGTO_APP_ID = import.meta.env.VITE_LOGTO_APP_ID?.trim() ?? ''
export const LOGTO_CALLBACK_PATH = import.meta.env.VITE_LOGTO_CALLBACK_PATH?.trim() || '/callback'
export const LOGTO_POST_LOGOUT_REDIRECT_URI = import.meta.env.VITE_LOGTO_POST_LOGOUT_REDIRECT_URI?.trim() ?? ''
export const LOGTO_API_RESOURCE = import.meta.env.VITE_LOGTO_API_RESOURCE?.trim() ?? ''

export const HAS_LOGTO = Boolean(LOGTO_ENDPOINT && LOGTO_APP_ID)

export function resolveLogtoCallbackUrl(): string {
  return new URL(LOGTO_CALLBACK_PATH, window.location.origin).toString()
}

export function resolvePostLogoutRedirectUrl(): string {
  if (LOGTO_POST_LOGOUT_REDIRECT_URI) return LOGTO_POST_LOGOUT_REDIRECT_URI
  return window.location.origin
}

