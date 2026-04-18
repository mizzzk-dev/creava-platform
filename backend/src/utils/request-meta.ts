import { createHash, randomUUID } from 'node:crypto'

const IP_HASH_SALT = process.env.AUDIT_IP_HASH_SALT ?? process.env.INQUIRY_IP_HASH_SALT ?? 'mizzz-audit-salt'

export function getOrCreateRequestId(ctx: any): string {
  const incoming = String(ctx.request.headers['x-request-id'] ?? '').trim()
  return incoming || randomUUID()
}

export function getClientIp(ctx: any): string {
  const forwarded = ctx.request.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? ctx.ip
  }
  return ctx.ip
}

export function getClientIpDigest(ctx: any): string {
  const ip = getClientIp(ctx)
  return createHash('sha256').update(`${ip}:${IP_HASH_SALT}`).digest('hex').slice(0, 12)
}

export function withRequestId(message: string, requestId?: string): string {
  if (!requestId) return message
  return `[rid=${requestId}] ${message}`
}
