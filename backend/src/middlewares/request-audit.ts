import type { Core } from '@strapi/strapi'

import { getClientIpDigest, getOrCreateRequestId, withRequestId } from '../utils/request-meta'

type AuditState = {
  count: number
  resetAt: number
}

const windowMs = Number(process.env.AUDIT_WINDOW_MS ?? 300_000)
const suspicious404Threshold = Number(process.env.AUDIT_404_THRESHOLD ?? 20)
const store = new Map<string, AuditState>()

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    await next()

    const ipHash = getClientIpDigest(ctx)
    const requestId = getOrCreateRequestId(ctx)
    const now = Date.now()

    if (ctx.status === 404) {
      const current = store.get(ipHash)
      if (!current || current.resetAt <= now) {
        store.set(ipHash, { count: 1, resetAt: now + windowMs })
      } else {
        current.count += 1
        if (current.count >= suspicious404Threshold) {
          strapi.log.warn(withRequestId(`[audit] high-404 ipHash=${ipHash} count=${current.count} path=${ctx.path}`, requestId))
        }
      }
    }

    if (ctx.path.startsWith('/api/') && ctx.status >= 400) {
      strapi.log.info(withRequestId(`[audit] api-error ipHash=${ipHash} status=${ctx.status} method=${ctx.method} path=${ctx.path}`, requestId))
    }
  }
}
