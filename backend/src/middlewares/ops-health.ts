import type { Core } from '@strapi/strapi'

const READINESS_TIMEOUT_MS = Number(process.env.READINESS_TIMEOUT_MS ?? 2_000)

function sanitizeStatus(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 180)
  }
  return 'unknown_error'
}

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    if (ctx.path === '/_health') {
      ctx.type = 'application/json'
      ctx.status = 200
      ctx.body = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptimeSec: Math.round(process.uptime()),
        env: process.env.NODE_ENV ?? 'development',
        version: process.env.npm_package_version ?? 'unknown',
      }
      return
    }

    if (ctx.path === '/_ready') {
      const startedAt = Date.now()
      const checks: Record<string, { ok: boolean; detail?: string }> = {
        database: { ok: false },
      }

      try {
        await Promise.race([
          strapi.db.connection.raw('select 1 as ok'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('db_timeout')), READINESS_TIMEOUT_MS)),
        ])
        checks.database = { ok: true }
      } catch (error) {
        checks.database = { ok: false, detail: sanitizeStatus(error) }
      }

      const allOk = Object.values(checks).every((item) => item.ok)
      ctx.type = 'application/json'
      ctx.status = allOk ? 200 : 503
      ctx.body = {
        status: allOk ? 'ready' : 'degraded',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        checks,
      }
      return
    }

    await next()
  }
}
