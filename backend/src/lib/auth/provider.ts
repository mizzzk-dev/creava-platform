import { hasRequiredScopes, verifyLogtoToken, type AuthenticatedUser } from './logto'
import { verifySupabaseToken } from './supabase'

const AUTH_PROVIDER = (process.env.AUTH_PROVIDER ?? 'logto').trim().toLowerCase()

export { hasRequiredScopes }
export type { AuthenticatedUser }

export async function verifyAccessToken(authorization: string | undefined): Promise<AuthenticatedUser> {
  if (AUTH_PROVIDER === 'supabase') {
    return verifySupabaseToken(authorization)
  }

  if (AUTH_PROVIDER === 'dual') {
    try {
      return await verifySupabaseToken(authorization)
    } catch {
      return verifyLogtoToken(authorization)
    }
  }

  return verifyLogtoToken(authorization)
}
