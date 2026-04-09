import crypto from 'node:crypto'

export function buildIdempotencyKey(prefix: string, payload: Record<string, unknown>): string {
  const base = JSON.stringify(payload)
  const digest = crypto.createHash('sha256').update(base).digest('hex')
  return `${prefix}_${digest.slice(0, 40)}`
}
