import type { Core } from '@strapi/strapi'
import { getOrCreateRequestId } from '../utils/request-meta'

export default (_config: unknown, _context: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const requestId = getOrCreateRequestId(ctx)
    ctx.state.requestId = requestId
    ctx.set('x-request-id', requestId)

    await next()
  }
}
