import { createHash } from 'node:crypto'
import { factories } from '@strapi/strapi'

const MAX_FILE_BYTES = Number(process.env.INQUIRY_MAX_FILE_BYTES ?? 10 * 1024 * 1024)
const MAX_FILES = Number(process.env.INQUIRY_MAX_FILES ?? 5)
const SPAM_WINDOW_MS = Number(process.env.INQUIRY_SPAM_WINDOW_MS ?? 10 * 60 * 1000)
const SPAM_MAX_PER_WINDOW = Number(process.env.INQUIRY_SPAM_MAX_PER_WINDOW ?? 8)

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])

const blockedWords = ['http://', 'https://', '<a ', '카지노', 'viagra', 'loan']

const ipHitMap = new Map<string, { count: number; resetAt: number }>()

function getClientIp(ctx: any): string {
  const forwarded = ctx.request.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? ctx.ip
  }
  return ctx.ip
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

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function scoreSpam(input: {
  honeypot?: string
  email?: string
  subject?: string
  message?: string
  userAgent?: string
}): { score: number; reason: string | null } {
  let score = 0
  const reasons: string[] = []

  if ((input.honeypot ?? '').trim().length > 0) {
    score += 10
    reasons.push('honeypot')
  }

  const text = `${input.subject ?? ''} ${input.message ?? ''}`.toLowerCase()
  if (blockedWords.some((w) => text.includes(w))) {
    score += 3
    reasons.push('blocked_word')
  }

  if ((input.email ?? '').endsWith('.ru')) {
    score += 2
    reasons.push('email_domain')
  }

  if ((input.userAgent ?? '').length === 0) {
    score += 1
    reasons.push('missing_user_agent')
  }

  return { score, reason: reasons.length > 0 ? reasons.join(',') : null }
}

export default factories.createCoreController(
  'api::inquiry-submission.inquiry-submission',
  ({ strapi }) => ({
    async publicSubmit(ctx) {
      const body = ctx.request.body ?? {}
      const files = toArray<any>(ctx.request.files?.attachments)

      const formType = String(body.formType ?? '')
      const email = String(body.email ?? '').trim()
      const name = String(body.name ?? '').trim()
      const subject = String(body.subject ?? '').trim()
      const message = String(body.message ?? '').trim()
      const policyAgree = String(body.policyAgree ?? '') === 'true'
      const honeypot = String(body.website ?? '')
      const sourceSite = String(body.sourceSite ?? 'unknown')
      const sourcePage = String(body.sourcePage ?? '')
      const locale = String(body.locale ?? 'ja')

      if (!['contact', 'request', 'restock'].includes(formType)) {
        return ctx.badRequest('formType が不正です')
      }

      if (!email || !email.includes('@')) {
        return ctx.badRequest('email が不正です')
      }

      if (formType !== 'restock' && !policyAgree) {
        return ctx.badRequest('policyAgree は必須です')
      }

      if (formType === 'contact' && (!subject || message.length < 10)) {
        return ctx.badRequest('contact の必須項目が不足しています')
      }

      if (formType === 'request' && message.length < 10) {
        return ctx.badRequest('request の必須項目が不足しています')
      }

      if (files.length > MAX_FILES) {
        return ctx.badRequest(`添付ファイルは最大 ${MAX_FILES} 件までです`)
      }

      for (const file of files) {
        if (file.size > MAX_FILE_BYTES) {
          return ctx.badRequest(`ファイルサイズ上限は ${MAX_FILE_BYTES} bytes です`)
        }
        if (!ALLOWED_MIME_TYPES.has(file.type)) {
          return ctx.badRequest(`許可されていない MIME type です: ${file.type}`)
        }
      }

      const userAgent = String(ctx.request.headers['user-agent'] ?? '')
      const ipHash = hashIp(getClientIp(ctx))
      const burstSpam = checkSpamBurst(ipHash)
      const spamAssessment = scoreSpam({ honeypot, email, subject, message, userAgent })
      const isSpam = burstSpam || spamAssessment.score >= 5

      const uploaded = files.length
        ? await strapi.plugin('upload').service('upload').upload({
            data: {},
            files,
          })
        : []

      const entry = await strapi.entityService.create('api::inquiry-submission.inquiry-submission', {
        data: {
          formType,
          inquiryCategory: String(body.inquiryCategory ?? ''),
          name,
          companyOrOrganization: String(body.companyOrOrganization ?? ''),
          email,
          phone: String(body.phone ?? ''),
          subject,
          message,
          attachments: uploaded.map((item: any) => item.id),
          locale,
          sourcePage,
          sourceSite: ['main', 'store', 'fc', 'unknown'].includes(sourceSite) ? sourceSite : 'unknown',
          status: isSpam ? 'spam' : 'new',
          submittedAt: new Date().toISOString(),
          ipHash,
          userAgent: userAgent.slice(0, 500),
          policyAgree,
          consentTextVersion: String(body.consentTextVersion ?? 'v1'),
          spamScore: spamAssessment.score + (burstSpam ? 10 : 0),
          spamReason: burstSpam ? 'burst_limit' : spamAssessment.reason,
          meta: {
            requestType: String(body.requestType ?? ''),
            budget: String(body.budget ?? ''),
            deadline: String(body.deadline ?? ''),
            productId: String(body.productId ?? ''),
            productSlug: String(body.productSlug ?? ''),
            productTitle: String(body.productTitle ?? ''),
          },
        },
      })

      ctx.body = {
        data: {
          id: entry.id,
          status: isSpam ? 'spam' : 'new',
          submittedAt: entry.submittedAt,
        },
      }
    },
  }),
)
