import type { Core } from '@strapi/strapi'

type AuditState = {
  count: number
  resetAt: number
}

const windowMs = Number(process.env.AUDIT_WINDOW_MS ?? 300_000)
const suspicious404Threshold = Number(process.env.AUDIT_404_THRESHOLD ?? 20)
const store = new Map<string, AuditState>()

function getClientIp(ctx: any): string {
  const forwarded = ctx.request.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? ctx.ip
  }
  return ctx.ip
}

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    await next()

    const ip = getClientIp(ctx)
    const now = Date.now()

    if (ctx.status === 404) {
      const current = store.get(ip)
      if (!current || current.resetAt <= now) {
        store.set(ip, { count: 1, resetAt: now + windowMs })
      } else {
        current.count += 1
        if (current.count >= suspicious404Threshold) {
          strapi.log.warn(`[audit] high-404 ip=${ip} count=${current.count} path=${ctx.path}`)
        }
      }
    }

    if (ctx.path.startsWith('/api/') && ctx.status >= 400) {
      strapi.log.info(`[audit] api-error ip=${ip} status=${ctx.status} method=${ctx.method} path=${ctx.path}`)
    }
  }
}
