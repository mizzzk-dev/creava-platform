import { createHash } from 'node:crypto'

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'zip'])
const MAX_FILE_BYTES = Number(process.env.INQUIRY_MAX_FILE_BYTES ?? 10 * 1024 * 1024)
const MAX_FILES = Number(process.env.INQUIRY_MAX_FILES ?? 3)
const MAX_TOTAL_FILE_BYTES = Number(process.env.INQUIRY_MAX_TOTAL_FILE_BYTES ?? 20 * 1024 * 1024)
const SPAM_WINDOW_MS = Number(process.env.INQUIRY_SPAM_WINDOW_MS ?? 10 * 60 * 1000)
const SPAM_MAX_PER_WINDOW = Number(process.env.INQUIRY_SPAM_MAX_PER_WINDOW ?? 8)

const ipHitMap = new Map<string, { count: number; resetAt: number }>()

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function getClientIp(ctx: any): string {
  return String(ctx.request.ip ?? ctx.ip ?? '')
}

function hashIp(ip: string): string {
  const salt = process.env.INQUIRY_IP_HASH_SALT ?? 'default-inquiry-salt'
  return createHash('sha256').update(`${ip}:${salt}`).digest('hex')
}

function checkSpamBurst(ipHash: string): boolean {
  const now = Date.now()
  const current = ipHitMap.get(ipHash)
  if (!current || current.resetAt <= now) {
    ipHitMap.set(ipHash, { count: 1, resetAt: now + SPAM_WINDOW_MS })
    return false
  }
  current.count += 1
  return current.count > SPAM_MAX_PER_WINDOW
}

function sanitizeFilename(fileName: string): string {
  const normalized = fileName.normalize('NFKC').replace(/[^a-zA-Z0-9._-]/g, '_')
  return normalized.slice(0, 120)
}

function getExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.')
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : ''
}

function validatePayload(payload: any): string | null {
  const formType = String(payload.formType ?? '')
  const message = String(payload.message ?? '')
  const subject = String(payload.subject ?? '')
  const email = String(payload.email ?? '')
  const policyAgree = payload.policyAgree === true

  if (!['contact', 'request', 'restock'].includes(formType)) return 'formType が不正です'
  if (!email || !email.includes('@')) return 'メール形式が不正です'
  if (formType !== 'restock' && !policyAgree) return 'policyAgree は必須です'
  if (subject.length < 2 || subject.length > 200) return '件名は2〜200文字で入力してください'
  if (message.length < 10 || message.length > 5000) return '本文は10〜5000文字で入力してください'
  return null
}

async function createSubmission(strapi: any, payload: any, ctx: any) {
  const invalid = validatePayload(payload)
  if (invalid) return { invalid }

  const attachmentIds = toArray<number>(payload.attachmentIds)
  const attachments = attachmentIds.length
    ? await strapi.entityService.findMany('plugin::upload.file', {
        filters: { id: { $in: attachmentIds } },
        fields: ['id', 'size'],
      })
    : []

  if (attachments.length !== attachmentIds.length) {
    return { invalid: '添付ファイルIDが不正です' }
  }
  if (attachmentIds.length > MAX_FILES) {
    return { invalid: `添付は最大 ${MAX_FILES} 件です` }
  }

  const totalAttachmentBytes = attachments.reduce((sum: number, file: any) => sum + Number(file.size ?? 0), 0)
  if (totalAttachmentBytes > MAX_TOTAL_FILE_BYTES) {
    return { invalid: `添付合計は ${MAX_TOTAL_FILE_BYTES} bytes 以下にしてください` }
  }

  const ipHash = hashIp(getClientIp(ctx))
  const burstSpam = checkSpamBurst(ipHash)
  const spamFlag = burstSpam || String(payload.website ?? '').trim().length > 0

  const entry = await strapi.entityService.create('api::inquiry-submission.inquiry-submission', {
    data: {
      formType: payload.formType,
      inquiryCategory: String(payload.inquiryCategory ?? ''),
      name: String(payload.name ?? ''),
      companyOrOrganization: String(payload.companyOrOrganization ?? ''),
      email: String(payload.email ?? ''),
      phone: String(payload.phone ?? ''),
      subject: String(payload.subject ?? ''),
      message: String(payload.message ?? ''),
      attachments: attachmentIds,
      locale: String(payload.locale ?? 'ja'),
      sourceSite: ['main', 'store', 'fc', 'unknown'].includes(String(payload.sourceSite ?? '')) ? payload.sourceSite : 'unknown',
      sourcePage: String(payload.sourcePage ?? ''),
      status: spamFlag ? 'spam' : 'new',
      submittedAt: new Date().toISOString(),
      ipHash,
      userAgent: String(ctx.request.headers['user-agent'] ?? '').slice(0, 500),
      policyAgree: payload.policyAgree === true,
      spamFlag,
      spamReason: spamFlag ? (burstSpam ? 'burst_limit' : 'honeypot') : null,
      meta: {
        requestType: String(payload.requestType ?? ''),
        budget: String(payload.budget ?? ''),
        deadline: String(payload.deadline ?? ''),
        productId: String(payload.productId ?? ''),
        productSlug: String(payload.productSlug ?? ''),
        productTitle: String(payload.productTitle ?? ''),
      },
    },
  })

  return { entry, spamFlag }
}

export default {
  async upload(ctx: any) {
    const files = toArray<any>(ctx.request.files?.attachments)
    if (files.length === 0) return ctx.badRequest('attachments が必要です')
    if (files.length > MAX_FILES) return ctx.badRequest(`添付は最大 ${MAX_FILES} 件です`)

    const totalBytes = files.reduce((sum, file) => sum + Number(file.size ?? 0), 0)
    if (totalBytes > MAX_TOTAL_FILE_BYTES) {
      return ctx.badRequest(`添付合計は ${MAX_TOTAL_FILE_BYTES} bytes 以下にしてください`)
    }

    for (const file of files) {
      if (Number(file.size ?? 0) > MAX_FILE_BYTES) {
        return ctx.badRequest(`1ファイル上限は ${MAX_FILE_BYTES} bytes です`)
      }
      if (!ALLOWED_MIME_TYPES.has(String(file.type ?? ''))) {
        return ctx.badRequest(`許可されていない MIME type です: ${file.type}`)
      }
      const ext = getExtension(String(file.name ?? ''))
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return ctx.badRequest(`許可されていない拡張子です: ${ext}`)
      }
      file.name = sanitizeFilename(String(file.name ?? 'file'))
    }

    const uploaded = await strapi.plugin('upload').service('upload').upload({ data: {}, files })
    ctx.body = { data: uploaded.map((file: any) => ({ id: file.id, name: file.name, mime: file.mime, size: file.size })) }
  },

  async confirm(ctx: any) {
    const payload = ctx.request.body ?? {}
    const invalid = validatePayload(payload)
    if (invalid) return ctx.badRequest(invalid)
    if (String(payload.website ?? '').trim().length > 0) return ctx.badRequest('不正な送信です')
    ctx.body = { data: { ok: true } }
  },

  async submit(ctx: any) {
    const payload = ctx.request.body ?? {}
    const { invalid, entry, spamFlag } = await createSubmission(strapi, payload, ctx)
    if (invalid) return ctx.badRequest(invalid)

    ctx.body = {
      data: {
        id: entry.id,
        status: spamFlag ? 'spam' : 'new',
        submittedAt: entry.submittedAt,
      },
    }
  },

  async list(ctx: any) {
    const query = ctx.query ?? {}
    const filters: Record<string, unknown> = {}
    if (query.status) filters.status = query.status
    if (query.sourceSite) filters.sourceSite = query.sourceSite
    if (query.dateFrom || query.dateTo) {
      filters.submittedAt = {
        ...(query.dateFrom ? { $gte: query.dateFrom } : {}),
        ...(query.dateTo ? { $lte: query.dateTo } : {}),
      }
    }

    const data = await strapi.entityService.findMany('api::inquiry-submission.inquiry-submission', {
      filters,
      sort: { submittedAt: 'desc' },
      populate: { attachments: true },
      limit: Number(query.limit ?? 50),
      start: Number(query.start ?? 0),
    })

    const newCount = await strapi.entityService.count('api::inquiry-submission.inquiry-submission', {
      filters: { status: 'new' },
    })

    ctx.body = { data, meta: { newCount } }
  },

  async detail(ctx: any) {
    const id = Number(ctx.params.id)
    if (!id) return ctx.badRequest('id が不正です')
    const data = await strapi.entityService.findOne('api::inquiry-submission.inquiry-submission', id, {
      populate: { attachments: true },
    })
    if (!data) return ctx.notFound('submission が見つかりません')
    ctx.body = { data }
  },

  async patch(ctx: any) {
    const id = Number(ctx.params.id)
    if (!id) return ctx.badRequest('id が不正です')

    const status = ctx.request.body?.status
    const adminMemo = ctx.request.body?.adminMemo
    const patchData: Record<string, unknown> = {}

    if (status !== undefined) {
      if (!['new', 'in_review', 'replied', 'closed', 'spam', 'failed'].includes(String(status))) {
        return ctx.badRequest('status が不正です')
      }
      patchData.status = status
      if (['in_review', 'replied', 'closed', 'failed'].includes(String(status))) {
        patchData.handledAt = new Date().toISOString()
      }
    }

    if (adminMemo !== undefined) patchData.adminMemo = String(adminMemo)

    const data = await strapi.entityService.update('api::inquiry-submission.inquiry-submission', id, {
      data: patchData,
      populate: { attachments: true },
    })

    ctx.body = { data }
  },
}
