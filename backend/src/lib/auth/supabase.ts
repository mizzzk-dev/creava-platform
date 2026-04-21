import { createPublicKey, createVerify } from 'node:crypto'
import type { AuthenticatedUser } from './logto'

type JwtHeader = { alg?: unknown; kid?: unknown }
type JwtPayload = { sub?: unknown; email?: unknown; session_id?: unknown; role?: unknown; iss?: unknown; aud?: unknown; exp?: unknown }
type Jwk = { kid?: string; kty?: string; alg?: string; use?: string; n?: string; e?: string }

const SUPABASE_ISSUER = process.env.SUPABASE_JWT_ISSUER
const SUPABASE_JWKS_URI = process.env.SUPABASE_JWKS_URI
const SUPABASE_JWT_AUDIENCE = process.env.SUPABASE_JWT_AUDIENCE ?? 'authenticated'

let cachedJwks: { keys: Jwk[]; fetchedAt: number } | null = null
const JWKS_CACHE_TTL_MS = 5 * 60 * 1000

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return Buffer.from(padded, 'base64').toString('utf8')
}

function parseBearerToken(authorization: string | undefined): string {
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Authorization Bearer トークンが必要です。')
  }
  const token = authorization.slice('Bearer '.length).trim()
  if (!token) throw new Error('Authorization トークンが空です。')
  return token
}

function splitJwt(token: string): [string, string, string] {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('JWT 形式が不正です。')
  return [parts[0], parts[1], parts[2]]
}

function parseHeader(segment: string): JwtHeader {
  return JSON.parse(decodeBase64Url(segment)) as JwtHeader
}

function parsePayload(segment: string): JwtPayload {
  return JSON.parse(decodeBase64Url(segment)) as JwtPayload
}

function decodeSignature(segment: string): Buffer {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return Buffer.from(padded, 'base64')
}

async function fetchJwks(): Promise<Jwk[]> {
  if (!SUPABASE_JWKS_URI) throw new Error('SUPABASE_JWKS_URI が未設定です。')

  const now = Date.now()
  if (cachedJwks && now - cachedJwks.fetchedAt < JWKS_CACHE_TTL_MS) {
    return cachedJwks.keys
  }

  const response = await fetch(SUPABASE_JWKS_URI)
  if (!response.ok) throw new Error(`JWKS 取得に失敗しました: HTTP ${response.status}`)
  const body = (await response.json()) as { keys?: Jwk[] }
  const keys = Array.isArray(body.keys) ? body.keys : []
  cachedJwks = { keys, fetchedAt: now }
  return keys
}

function assertPayload(payload: JwtPayload): void {
  if (SUPABASE_ISSUER && payload.iss !== SUPABASE_ISSUER) {
    throw new Error('issuer が一致しません。')
  }

  const audience = payload.aud
  const validAudience = Array.isArray(audience)
    ? audience.includes(SUPABASE_JWT_AUDIENCE)
    : audience === SUPABASE_JWT_AUDIENCE
  if (!validAudience) throw new Error('audience が一致しません。')

  if (typeof payload.exp === 'number') {
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp <= now) throw new Error('JWT の有効期限が切れています。')
  }
}

async function verifySignature(token: string, header: JwtHeader): Promise<void> {
  if (header.alg !== 'RS256') throw new Error('未対応の署名アルゴリズムです。')
  if (typeof header.kid !== 'string' || !header.kid) throw new Error('JWT header.kid がありません。')

  const keys = await fetchJwks()
  const jwk = keys.find((key) => key.kid === header.kid)
  if (!jwk) throw new Error('一致する JWK を取得できません。')

  const [encodedHeader, encodedPayload, encodedSignature] = splitJwt(token)
  const message = Buffer.from(`${encodedHeader}.${encodedPayload}`)
  const signature = decodeSignature(encodedSignature)
  const keyObject = createPublicKey({ key: jwk, format: 'jwk' })
  const verifier = createVerify('RSA-SHA256')
  verifier.update(message)
  verifier.end()
  if (!verifier.verify(keyObject, signature)) {
    throw new Error('JWT 署名検証に失敗しました。')
  }
}

export async function verifySupabaseToken(authorization: string | undefined): Promise<AuthenticatedUser> {
  const token = parseBearerToken(authorization)
  const [encodedHeader, encodedPayload] = splitJwt(token)
  const header = parseHeader(encodedHeader)
  const payload = parsePayload(encodedPayload)

  await verifySignature(token, header)
  assertPayload(payload)

  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('Supabase JWT の sub を取得できません。')
  }

  return {
    userId: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : null,
    sessionId: typeof payload.session_id === 'string' ? payload.session_id : null,
    scopes: typeof payload.role === 'string' ? [payload.role] : [],
    claims: payload as Record<string, unknown>,
  }
}
