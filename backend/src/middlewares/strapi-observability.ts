import type { Core } from '@strapi/strapi'

import { getOrCreateRequestId, withRequestId } from '../utils/request-meta'

const API_SLOW_REQUEST_MS = Number(process.env.API_SLOW_REQUEST_MS ?? 1200)
const API_TRACE_SAMPLE_RATE = Math.min(
  1,
  Math.max(0, Number(process.env.API_TRACE_SAMPLE_RATE ?? 0.2)),
)

function shouldLogTrace(): boolean {
  return Math.random() < API_TRACE_SAMPLE_RATE
}

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const startedAt = Date.now()
    const requestId = getOrCreateRequestId(ctx)

    await next()

    if (!ctx.path.startsWith('/api/')) return

    const durationMs = Date.now() - startedAt
    ctx.set('server-timing', `app;dur=${durationMs}`)

    const meta = `method=${ctx.method} path=${ctx.path} status=${ctx.status} durationMs=${durationMs}`

    if (ctx.status >= 500) {
      strapi.log.error(withRequestId(`[strapi-observability] api-error ${meta}`, requestId))
      return
    }

    if (durationMs >= API_SLOW_REQUEST_MS) {
      strapi.log.warn(withRequestId(`[strapi-observability] slow-request ${meta} thresholdMs=${API_SLOW_REQUEST_MS}`, requestId))
      return
    }

    if (shouldLogTrace()) {
      strapi.log.info(withRequestId(`[strapi-observability] trace ${meta}`, requestId))
    }
  }
}
