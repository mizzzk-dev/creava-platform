import { randomUUID } from 'node:crypto'

const DEFAULT_LOCALE = 'ja'
const SUPPORTED_LOCALES = new Set(['ja', 'en', 'ko'])

const CONTENT_DEPENDENCY_MAP: Record<string, { sites: string[]; paths: string[]; tags: string[] }> = {
  'api::news-item.news-item': {
    sites: ['main'],
    paths: ['/news', '/'],
    tags: ['news', 'home'],
  },
  'api::blog-post.blog-post': {
    sites: ['main'],
    paths: ['/blog', '/'],
    tags: ['blog', 'home'],
  },
  'api::event.event': {
    sites: ['main'],
    paths: ['/events', '/'],
    tags: ['events', 'home'],
  },
  'api::work.work': {
    sites: ['main'],
    paths: ['/works', '/'],
    tags: ['works', 'home'],
  },
  'api::store-product.store-product': {
    sites: ['store', 'main'],
    paths: ['/store', '/store/products', '/'],
    tags: ['store-products', 'home'],
  },
  'api::fanclub-content.fanclub-content': {
    sites: ['fc', 'main'],
    paths: ['/fanclub', '/member', '/'],
    tags: ['fanclub-content', 'home'],
  },
  'api::site-setting.site-setting': {
    sites: ['main', 'store', 'fc'],
    paths: ['/', '/store', '/fanclub'],
    tags: ['site-settings', 'home', 'layout'],
  },
}

type CmsChangePayload = {
  event?: string
  model?: string
  createdAt?: string
  entry?: Record<string, unknown>
}

function normalizeLocale(raw: unknown): string {
  const locale = String(raw ?? '').trim().toLowerCase()
  if (SUPPORTED_LOCALES.has(locale)) return locale
  return DEFAULT_LOCALE
}

function isValidSecret(secret: string, expected: string): boolean {
  return Boolean(expected) && Boolean(secret) && secret === expected
}

function toTarget(model: string, locale: string): {
  sites: string[]
  paths: string[]
  tags: string[]
  locale: string
} {
  const mapped = CONTENT_DEPENDENCY_MAP[model]
  if (!mapped) {
    return {
      sites: ['main', 'store', 'fc'],
      paths: ['/'],
      tags: ['global-fallback'],
      locale,
    }
  }

  return {
    sites: mapped.sites,
    paths: mapped.paths,
    tags: mapped.tags,
    locale,
  }
}

function toEntryStatus(entry: Record<string, unknown>): 'published' | 'draft' {
  const publishedAt = entry.publishedAt
  return typeof publishedAt === 'string' && publishedAt.length > 0 ? 'published' : 'draft'
}

async function writeAuditLog(strapi: any, input: {
  action: string
  status: 'success' | 'failed' | 'denied'
  targetType: string
  targetId: string
  requestId: string
  metadata: Record<string, unknown>
  reason?: string
}) {
  try {
    await strapi.documents('api::internal-audit-log.internal-audit-log').create({
      data: {
        actorLogtoUserId: 'system:strapi-cms-sync',
        actorInternalRoles: ['system', 'cms-sync'],
        targetType: input.targetType,
        targetId: input.targetId,
        action: input.action,
        status: input.status,
        reason: input.reason,
        sourceSite: 'cross',
        metadata: input.metadata,
        requestId: input.requestId,
      },
    })
  } catch (error) {
    strapi.log.warn(`[cms-sync] internal audit log の保存に失敗: ${(error as Error).message}`)
  }
}

export default {
  async strapiWebhook(ctx: any) {
    const webhookSecret = String(ctx.request.headers['x-strapi-webhook-secret'] ?? '').trim()
    const expectedSecret = String(process.env.STRAPI_PUBLISH_WEBHOOK_SECRET ?? '').trim()
    const requestId = String(ctx.request.headers['x-request-id'] ?? randomUUID())

    if (!isValidSecret(webhookSecret, expectedSecret)) {
      await writeAuditLog(strapi, {
        action: 'strapi_webhook_revalidate',
        status: 'denied',
        targetType: 'strapi-webhook',
        targetId: 'unauthorized',
        requestId,
        reason: 'webhook secret mismatch',
        metadata: {
          hasSecret: Boolean(webhookSecret),
        },
      })
      return ctx.unauthorized('strapi webhook secret が不正です')
    }

    const payload = (ctx.request.body ?? {}) as CmsChangePayload
    const event = String(payload.event ?? 'unknown')
    const model = String(payload.model ?? 'unknown')
    const entry = payload.entry ?? {}
    const locale = normalizeLocale(entry.locale)
    const entryStatus = toEntryStatus(entry)
    const target = toTarget(model, locale)
    const traceId = randomUUID()

    const shouldSkip = !event.startsWith('entry.')
    const result = {
      traceId,
      requestId,
      event,
      model,
      locale,
      strapiPublishState: entryStatus,
      strapiContentChangedAt: payload.createdAt ?? new Date().toISOString(),
      strapiRevalidatedAt: new Date().toISOString(),
      strapiDependencyState: {
        sites: target.sites,
        paths: target.paths,
        tags: target.tags,
      },
      skipped: shouldSkip,
      reason: shouldSkip ? 'entry.* イベントのみ revalidate 対象にしています' : null,
    }

    await writeAuditLog(strapi, {
      action: 'strapi_webhook_revalidate',
      status: 'success',
      targetType: model,
      targetId: String((entry.documentId ?? entry.id ?? 'unknown')),
      requestId,
      metadata: result,
    })

    strapi.log.info(`[cms-sync] ${event} ${model} locale=${locale} traceId=${traceId}`)

    ctx.send({
      ok: true,
      ...result,
    })
  },

  async verifyPreview(ctx: any) {
    const body = (ctx.request.body ?? {}) as { secret?: string; type?: string; slug?: string; locale?: string }
    const secret = String(body.secret ?? '').trim()
    const expected = String(process.env.PREVIEW_SHARED_SECRET ?? '').trim()

    if (!isValidSecret(secret, expected)) {
      return ctx.unauthorized('preview secret が不正です')
    }

    const locale = normalizeLocale(body.locale)
    const traceId = randomUUID()

    await writeAuditLog(strapi, {
      action: 'strapi_preview_verify',
      status: 'success',
      targetType: String(body.type ?? 'unknown'),
      targetId: String(body.slug ?? 'unknown'),
      requestId: traceId,
      metadata: {
        locale,
        previewRequestedAt: new Date().toISOString(),
      },
    })

    ctx.send({
      ok: true,
      locale,
      traceId,
      previewVerifiedAt: new Date().toISOString(),
    })
  },

  async manualRevalidate(ctx: any) {
    const opsToken = String(ctx.request.headers['x-cms-ops-token'] ?? '').trim()
    const expected = String(process.env.CMS_REVALIDATE_OPS_TOKEN ?? '').trim()
    if (!isValidSecret(opsToken, expected)) {
      return ctx.unauthorized('ops token が不正です')
    }

    const body = (ctx.request.body ?? {}) as {
      model?: string
      locale?: string
      reason?: string
      paths?: string[]
      tags?: string[]
    }

    const model = String(body.model ?? 'manual')
    const locale = normalizeLocale(body.locale)
    const target = toTarget(model, locale)
    const mergedPaths = Array.isArray(body.paths) && body.paths.length > 0 ? body.paths : target.paths
    const mergedTags = Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : target.tags
    const traceId = randomUUID()

    await writeAuditLog(strapi, {
      action: 'strapi_manual_revalidate',
      status: 'success',
      targetType: model,
      targetId: traceId,
      requestId: traceId,
      reason: body.reason,
      metadata: {
        locale,
        paths: mergedPaths,
        tags: mergedTags,
        requestedAt: new Date().toISOString(),
      },
    })

    ctx.send({
      ok: true,
      traceId,
      model,
      locale,
      paths: mergedPaths,
      tags: mergedTags,
      requestedAt: new Date().toISOString(),
    })
  },
}
