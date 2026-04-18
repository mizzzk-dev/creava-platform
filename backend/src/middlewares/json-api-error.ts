import type { Core } from '@strapi/strapi'

import { getOrCreateRequestId, withRequestId } from '../utils/request-meta'

type AnyError = Error & {
  status?: number
  statusCode?: number
  details?: unknown
}

function shouldForceJson(path: string): boolean {
  return path.startsWith('/api/') || path.startsWith('/content-manager/') || path.startsWith('/upload/')
}

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    try {
      await next()

      if (!shouldForceJson(ctx.path)) return

      const contentType = ctx.response.get('content-type') || ''
      const requestId = getOrCreateRequestId(ctx)
      if (typeof ctx.body === 'string' && contentType.includes('text/html')) {
        strapi.log.error(withRequestId(`[json-api-error] HTML response intercepted: ${ctx.method} ${ctx.path}`, requestId))
        ctx.type = 'application/json'
        ctx.status = ctx.status >= 400 ? ctx.status : 500
        ctx.body = {
          error: {
            name: 'NonJsonResponseError',
            message: 'HTML レスポンスを返却していたため JSON エラーへ正規化しました。',
            details: {
              path: ctx.path,
              method: ctx.method,
              requestId,
            },
          },
        }
      }
    } catch (err) {
      const error = err as AnyError
      const status = error.status ?? error.statusCode ?? 500
      const requestId = getOrCreateRequestId(ctx)

      if (!shouldForceJson(ctx.path)) {
        throw err
      }

      strapi.log.error(withRequestId(`[json-api-error] ${ctx.method} ${ctx.path} failed: ${error.message}`, requestId))
      ctx.type = 'application/json'
      ctx.status = status
      ctx.body = {
        error: {
          name: error.name || 'StrapiRequestError',
          message: error.message || 'Unexpected error',
          details: process.env.NODE_ENV === 'production'
            ? { requestId }
            : { requestId, ...(error.details as Record<string, unknown> ?? {}) },
        },
      }
    }
  }
}
