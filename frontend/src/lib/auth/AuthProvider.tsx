import { createContext, useContext, useMemo, useState, useEffect, type PropsWithChildren } from 'react'
import {
  AUTH_PROVIDER,
  HAS_AUTH,
  HAS_LOGTO,
  LOGTO_API_RESOURCE,
  LOGTO_APP_ID,
  LOGTO_ENDPOINT,
  SUPABASE_OAUTH_DEFAULT_PROVIDER,
  SUPABASE_URL,
  resolveLogtoCallbackUrl,
  resolvePostLogoutRedirectUrl,
} from './config'

const AUTH_STORAGE_PREFIX = 'auth_unified'
const ACCESS_TOKEN_KEY = `${AUTH_STORAGE_PREFIX}_access_token`
const ID_TOKEN_KEY = `${AUTH_STORAGE_PREFIX}_id_token`
const REFRESH_TOKEN_KEY = `${AUTH_STORAGE_PREFIX}_refresh_token`
const CODE_VERIFIER_KEY = `${AUTH_STORAGE_PREFIX}_code_verifier`
const OAUTH_STATE_KEY = `${AUTH_STORAGE_PREFIX}_oauth_state`
const REDIRECT_AFTER_SIGN_IN_KEY = `${AUTH_STORAGE_PREFIX}_redirect_after_signin`

export interface AuthClient {
  isEnabled: boolean
  isLoaded: boolean
  isSignedIn: boolean
  claims: Record<string, unknown> | null
  signIn: (redirectPath?: string) => Promise<void>
  signUp: (redirectPath?: string) => Promise<void>
  signOut: () => Promise<void>
  getAccessToken: () => Promise<string | null>
  handleCallback: () => Promise<string>
}

const disabledAuthClient: AuthClient = {
  isEnabled: false,
  isLoaded: true,
  isSignedIn: false,
  claims: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  getAccessToken: async () => null,
  handleCallback: async () => '/',
}

const AuthContext = createContext<AuthClient>(disabledAuthClient)

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = atob(padded)
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

function randomString(size = 64): string {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function toCodeChallenge(verifier: string): Promise<string> {
  const input = new TextEncoder().encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', input)
  const bytes = new Uint8Array(hash)
  const base64 = btoa(String.fromCharCode(...bytes))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function readSearchParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name)
}

function normalizeRedirectPath(raw: string | null): string {
  if (!raw) return '/'
  if (!raw.startsWith('/')) return '/'
  if (raw.startsWith('//')) return '/'
  return raw
}

function isAccessTokenExpired(token: string | null): boolean {
  if (!token) return true
  const payload = decodeJwtPayload(token)
  const exp = payload?.exp
  if (typeof exp !== 'number') return false
  const nowWithSkew = Math.floor(Date.now() / 1000) + 30
  return exp <= nowWithSkew
}

async function exchangeSupabaseCodeForSession(code: string, codeVerifier: string): Promise<{ access_token?: string; refresh_token?: string; token_type?: string }> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ auth_code: code, code_verifier: codeVerifier }),
  })
  if (!response.ok) throw new Error('Supabase token exchange に失敗しました。')
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) throw new Error('Supabase token response が JSON ではありません。')
  return response.json() as Promise<{ access_token?: string; refresh_token?: string; token_type?: string }>
}

export function AppAuthProvider({ children }: PropsWithChildren) {
  const [isLoaded, setLoaded] = useState(!HAS_AUTH)
  const [claims, setClaims] = useState<Record<string, unknown> | null>(() => {
    const token = localStorage.getItem(ID_TOKEN_KEY) ?? localStorage.getItem(ACCESS_TOKEN_KEY)
    return token ? decodeJwtPayload(token) : null
  })

  useEffect(() => {
    setLoaded(true)
  }, [])

  const value = useMemo<AuthClient>(() => {
    if (!HAS_AUTH) return disabledAuthClient

    if (AUTH_PROVIDER === 'supabase') {
      return {
        isEnabled: true,
        isLoaded,
        isSignedIn: Boolean(localStorage.getItem(ACCESS_TOKEN_KEY) && claims?.sub),
        claims,
        signIn: async (redirectPath?: string) => {
          const codeVerifier = randomString(32)
          const state = randomString(16)
          const codeChallenge = await toCodeChallenge(codeVerifier)
          sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier)
          sessionStorage.setItem(OAUTH_STATE_KEY, state)

          const safeRedirectPath = normalizeRedirectPath(redirectPath ?? window.location.pathname)
          sessionStorage.setItem(REDIRECT_AFTER_SIGN_IN_KEY, safeRedirectPath)
          const redirectTo = new URL('/callback', window.location.origin)
          redirectTo.searchParams.set('redirect', safeRedirectPath)

          const params = new URLSearchParams({
            provider: SUPABASE_OAUTH_DEFAULT_PROVIDER,
            redirect_to: redirectTo.toString(),
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state,
          })
          window.location.assign(`${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`)
        },
        signUp: async (redirectPath?: string) => {
          const path = redirectPath ?? window.location.pathname
          await value.signIn(path)
        },
        signOut: async () => {
          const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
          localStorage.removeItem(ACCESS_TOKEN_KEY)
          localStorage.removeItem(ID_TOKEN_KEY)
          localStorage.removeItem(REFRESH_TOKEN_KEY)
          setClaims(null)
          if (accessToken) {
            await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` },
            }).catch(() => undefined)
          }
          window.location.assign(resolvePostLogoutRedirectUrl())
        },
        getAccessToken: async () => {
          const token = localStorage.getItem(ACCESS_TOKEN_KEY)
          if (!isAccessTokenExpired(token)) return token

          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
          if (!refreshToken) return null

          const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          })
          if (!response.ok) return null
          const json = await response.json() as { access_token?: string; refresh_token?: string }
          if (!json.access_token) return null
          localStorage.setItem(ACCESS_TOKEN_KEY, json.access_token)
          if (json.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, json.refresh_token)
          setClaims(decodeJwtPayload(json.access_token))
          return json.access_token
        },
        handleCallback: async () => {
          const code = readSearchParam('code')
          const state = readSearchParam('state')
          const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY)
          const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY)
          if (!code || !state || !codeVerifier || state !== expectedState) {
            throw new Error('OAuth callback パラメータが不正です。')
          }

          const session = await exchangeSupabaseCodeForSession(code, codeVerifier)
          if (!session.access_token) throw new Error('Supabase アクセストークンを取得できませんでした。')

          localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token)
          if (session.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token)
          setClaims(decodeJwtPayload(session.access_token))

          sessionStorage.removeItem(CODE_VERIFIER_KEY)
          sessionStorage.removeItem(OAUTH_STATE_KEY)
          const redirectPath = normalizeRedirectPath(
            new URLSearchParams(window.location.search).get('redirect') ?? sessionStorage.getItem(REDIRECT_AFTER_SIGN_IN_KEY),
          )
          sessionStorage.removeItem(REDIRECT_AFTER_SIGN_IN_KEY)
          return redirectPath
        },
      }
    }

    if (!HAS_LOGTO) return disabledAuthClient

    const beginSignIn = async (redirectPath?: string, screenHint?: 'sign_up') => {
      const codeVerifier = randomString(32)
      const state = randomString(16)
      const codeChallenge = await toCodeChallenge(codeVerifier)
      sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier)
      sessionStorage.setItem(OAUTH_STATE_KEY, state)

      const callbackUri = resolveLogtoCallbackUrl()
      const scope = ['openid', 'profile', 'email', 'offline_access'].join(' ')
      const safeRedirectPath = normalizeRedirectPath(redirectPath ?? window.location.pathname)
      sessionStorage.setItem(REDIRECT_AFTER_SIGN_IN_KEY, safeRedirectPath)
      const search = new URLSearchParams({
        client_id: LOGTO_APP_ID,
        redirect_uri: callbackUri,
        response_type: 'code',
        scope,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state,
      })
      if (LOGTO_API_RESOURCE) {
        search.set('resource', LOGTO_API_RESOURCE)
      }
      if (screenHint === 'sign_up') {
        search.set('first_screen', 'register')
      }
      window.location.assign(`${LOGTO_ENDPOINT}/oidc/auth?${search.toString()}`)
    }

    return {
      isEnabled: true,
      isLoaded,
      isSignedIn: Boolean(localStorage.getItem(ACCESS_TOKEN_KEY) && claims?.sub),
      claims,
      signIn: async (redirectPath?: string) => beginSignIn(redirectPath),
      signUp: async (redirectPath?: string) => {
        const path = redirectPath ?? window.location.pathname
        await beginSignIn(path, 'sign_up')
      },
      signOut: async () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(ID_TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        setClaims(null)
        const params = new URLSearchParams({
          client_id: LOGTO_APP_ID,
          post_logout_redirect_uri: resolvePostLogoutRedirectUrl(),
        })
        window.location.assign(`${LOGTO_ENDPOINT}/oidc/session/end?${params.toString()}`)
      },
      getAccessToken: async () => {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY)
        if (!isAccessTokenExpired(token)) return token

        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
        if (!refreshToken) return null

        const body = new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: LOGTO_APP_ID,
          refresh_token: refreshToken,
        })
        if (LOGTO_API_RESOURCE) {
          body.set('resource', LOGTO_API_RESOURCE)
        }

        const response = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        })
        if (!response.ok) return null
        const contentType = response.headers.get('content-type') ?? ''
        if (!contentType.includes('application/json')) return null
        const json = await response.json() as { access_token?: string; id_token?: string; refresh_token?: string }
        if (!json.access_token) return null
        localStorage.setItem(ACCESS_TOKEN_KEY, json.access_token)
        if (json.id_token) {
          localStorage.setItem(ID_TOKEN_KEY, json.id_token)
          setClaims(decodeJwtPayload(json.id_token))
        }
        if (json.refresh_token) {
          localStorage.setItem(REFRESH_TOKEN_KEY, json.refresh_token)
        }
        return json.access_token
      },
      handleCallback: async () => {
        const code = readSearchParam('code')
        const state = readSearchParam('state')
        const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY)
        const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY)
        if (!code || !state || !codeVerifier || state !== expectedState) {
          throw new Error('OAuth callback パラメータが不正です。')
        }

        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: resolveLogtoCallbackUrl(),
          client_id: LOGTO_APP_ID,
          code_verifier: codeVerifier,
        })
        if (LOGTO_API_RESOURCE) {
          body.set('resource', LOGTO_API_RESOURCE)
        }

        const response = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        })
        if (!response.ok) throw new Error('Logto token endpoint でエラーが発生しました。')
        const contentType = response.headers.get('content-type') ?? ''
        if (!contentType.includes('application/json')) {
          throw new Error('Logto token endpoint の content-type が不正です。')
        }
        const json = await response.json() as { access_token?: string; id_token?: string; refresh_token?: string }
        if (!json.access_token || !json.id_token) throw new Error('アクセストークンを取得できませんでした。')

        localStorage.setItem(ACCESS_TOKEN_KEY, json.access_token)
        localStorage.setItem(ID_TOKEN_KEY, json.id_token)
        if (json.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, json.refresh_token)
        setClaims(decodeJwtPayload(json.id_token))
        sessionStorage.removeItem(CODE_VERIFIER_KEY)
        sessionStorage.removeItem(OAUTH_STATE_KEY)
        const redirectPath = normalizeRedirectPath(sessionStorage.getItem(REDIRECT_AFTER_SIGN_IN_KEY))
        sessionStorage.removeItem(REDIRECT_AFTER_SIGN_IN_KEY)
        return redirectPath
      },
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claims, isLoaded])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthClient(): AuthClient {
  return useContext(AuthContext)
}
