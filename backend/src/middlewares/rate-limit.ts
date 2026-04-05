import type { Core } from '@strapi/strapi'

type HitState = {
  count: number
  resetAt: number
}

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000)
const maxPerWindow = Number(process.env.RATE_LIMIT_MAX ?? 120)
const store = new Map<string, HitState>()

function getClientIp(ctx: any): string {
  const forwarded = ctx.request.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? ctx.ip
  }
  return ctx.ip
}

function shouldLimitPath(path: string): boolean {
  return path.startsWith('/api/')
}

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    if (!shouldLimitPath(ctx.path)) {
      await next()
      return
    }

    const now = Date.now()
    const key = getClientIp(ctx)
    const current = store.get(key)

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      await next()
      return
    }

    current.count += 1

    if (current.count > maxPerWindow) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
      ctx.set('Retry-After', String(retryAfter))
      ctx.status = 429
      ctx.body = {
        error: {
          name: 'RateLimitExceeded',
          message: '一定時間内のアクセス回数が上限を超えました。',
          details: { retryAfterSeconds: retryAfter },
        },
      }
      strapi.log.warn(`[rate-limit] blocked ip=${key} path=${ctx.path} count=${current.count}`)
      return
    }

    await next()
  }
}
