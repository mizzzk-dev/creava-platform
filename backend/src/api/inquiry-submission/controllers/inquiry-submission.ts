import { createHash } from 'node:crypto'
import { factories } from '@strapi/strapi'
import { mergeWithDefaults, selectFormDefinition } from '../../../utils/form-definitions'
import { getOrCreateRequestId, withRequestId } from '../../../utils/request-meta'
import { verifyAccessToken } from '../../../lib/auth/provider'

const MAX_FILE_BYTES = Number(process.env.INQUIRY_MAX_FILE_BYTES ?? 10 * 1024 * 1024)
const MAX_FILES = Number(process.env.INQUIRY_MAX_FILES ?? 5)
const SPAM_WINDOW_MS = Number(process.env.INQUIRY_SPAM_WINDOW_MS ?? 10 * 60 * 1000)
const SPAM_MAX_PER_WINDOW = Number(process.env.INQUIRY_SPAM_MAX_PER_WINDOW ?? 8)
const DUPLICATE_WINDOW_MS = Number(process.env.INQUIRY_DUPLICATE_WINDOW_MS ?? 90 * 1000)
const CONTACT_REPLY_DAYS = Number(process.env.INQUIRY_REPLY_SLA_DAYS ?? 3)
const MY_HISTORY_PAGE_MAX = Number(process.env.INQUIRY_MY_HISTORY_PAGE_MAX ?? 50)
const MY_SUMMARY_MAX_ROWS = Number(process.env.INQUIRY_MY_SUMMARY_MAX_ROWS ?? 200)
const CASE_REPLY_MAX_LENGTH = Number(process.env.INQUIRY_CASE_REPLY_MAX_LENGTH ?? 8000)

const ALLOWED_LOCALES = new Set(['ja', 'en', 'ko'])
const FALLBACK_FORM_TYPES = new Set(['contact', 'request', 'restock', 'application', 'entry', 'collaboration', 'event', 'store_support', 'fc_support'])

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

const ALLOWED_FILE_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.gif', '.webp',
])

const blockedWords = ['http://', 'https://', '<a ', '카지노', 'viagra', 'loan', 'bit.ly', 't.co', 'telegram']
const suspiciousCharsRegex = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g

const ipHitMap = new Map<string, { count: number; resetAt: number }>()
const duplicateMap = new Map<string, number>()

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

function checkDuplicate(payloadHash: string): boolean {
  const now = Date.now()
  const prev = duplicateMap.get(payloadHash)
  duplicateMap.set(payloadHash, now)
  if (!prev) return false
  return now - prev <= DUPLICATE_WINDOW_MS
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function normalizeLocale(value: string): string {
  const locale = value.trim().toLowerCase()
  return ALLOWED_LOCALES.has(locale) ? locale : 'ja'
}

function normalizeSourceSite(value: string): 'main' | 'store' | 'fc' | 'unknown' {
  const sourceSite = value.trim().toLowerCase()
  if (sourceSite === 'main' || sourceSite === 'store' || sourceSite === 'fc') return sourceSite
  return 'unknown'
}

function normalizeText(value: unknown, maxLength = 5000): string {
  const raw = String(value ?? '').replace(suspiciousCharsRegex, '')
  return raw.trim().slice(0, maxLength)
}

function hasOnlyUrlishContent(input: string): boolean {
  if (!input) return false
  const lowered = input.toLowerCase()
  const tokens = lowered.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return false
  const urlTokenCount = tokens.filter((token) => token.includes('http') || token.includes('.com') || token.includes('.ru')).length
  return urlTokenCount / tokens.length >= 0.75
}

function scoreSpam(input: {
  honeypot?: string
  email?: string
  subject?: string
  message?: string
  userAgent?: string
  duplicate?: boolean
  hasBlockedAttachment?: boolean
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

  if (hasOnlyUrlishContent(text)) {
    score += 3
    reasons.push('url_heavy')
  }

  if ((input.email ?? '').endsWith('.ru')) {
    score += 2
    reasons.push('email_domain')
  }

  if ((input.userAgent ?? '').length === 0) {
    score += 1
    reasons.push('missing_user_agent')
  }

  if (input.duplicate) {
    score += 4
    reasons.push('duplicate_payload')
  }

  if (input.hasBlockedAttachment) {
    score += 5
    reasons.push('blocked_attachment')
  }

  return { score, reason: reasons.length > 0 ? reasons.join(',') : null }
}


async function loadActiveFormDefinitions(strapi: any) {
  const fromCms = await strapi.entityService.findMany('api::form-definition.form-definition', {
    fields: [
      'formType', 'formKey', 'formTitle', 'formDescription', 'sourceSite', 'isPublic', 'requiresAuth', 'fields',
      'confirmEnabled', 'attachmentEnabled', 'allowedMimeTypes', 'maxFiles', 'maxFileSize', 'notificationTarget',
      'autoReplyEnabled', 'successMessage', 'failureMessage', 'locale', 'displayPriority', 'isActive',
      'defaultCategory', 'initialStatus', 'initialPriority',
    ],
    filters: { isActive: true },
    publicationState: 'live',
    limit: 200,
  }).catch(() => [])

  return mergeWithDefaults(fromCms as any[])
}

function resolveNotificationTargets(definition: any, sourceSite: string): string[] {
  const routedKey = `INQUIRY_NOTIFY_TO_${sourceSite.toUpperCase()}_${String(definition?.formType ?? '').toUpperCase()}`
  const routed = String(process.env[routedKey] ?? '').split(',').map((v) => v.trim()).filter(Boolean)
  if (routed.length) return routed

  const sourceOnly = String(process.env[`INQUIRY_NOTIFY_TO_${sourceSite.toUpperCase()}`] ?? '').split(',').map((v) => v.trim()).filter(Boolean)
  if (sourceOnly.length) return sourceOnly

  if (Array.isArray(definition?.notificationTarget) && definition.notificationTarget.length > 0) {
    const list = definition.notificationTarget.map((v: unknown) => String(v).trim()).filter(Boolean)
    if (list.length > 0) return list
  }

  return String(process.env.INQUIRY_NOTIFY_TO ?? '').split(',').map((emailAddress) => emailAddress.trim()).filter(Boolean)
}

function defaultCategoryBySite(site: 'main' | 'store' | 'fc' | 'unknown', formType: string): string {
  if (formType === 'restock') return 'restock'
  if (site === 'store') return 'order'
  if (site === 'fc') return 'membership'
  return formType === 'request' ? 'project_request' : 'general'
}

function normalizeCategory(sourceSite: 'main' | 'store' | 'fc' | 'unknown', formType: string, rawCategory: string, requestType: string): string {
  const normalized = normalizeText(rawCategory, 80).toLowerCase()
  if (normalized) return normalized
  if (formType === 'request' && requestType) return normalizeText(requestType, 80).toLowerCase()
  return defaultCategoryBySite(sourceSite, formType)
}

function extensionFromFilename(name: string): string {
  const index = name.lastIndexOf('.')
  if (index < 0) return ''
  return name.slice(index).toLowerCase()
}

function buildAttachmentMeta(uploaded: any[]): Array<Record<string, unknown>> {
  return uploaded.map((item) => ({
    id: item.id,
    name: item.name,
    ext: item.ext,
    mime: item.mime,
    size: item.size,
    url: item.url,
    hash: item.hash,
    provider: item.provider,
  }))
}

function buildInquiryNumber(sourceSite: 'main' | 'store' | 'fc' | 'unknown', submittedAtIso: string, id: number | string): string {
  const sitePrefix = sourceSite === 'unknown' ? 'MZ' : sourceSite.toUpperCase()
  const day = submittedAtIso.slice(0, 10).replace(/-/g, '')
  const serial = String(id).padStart(6, '0')
  return `${sitePrefix}-${day}-${serial}`
}

function mapRequesterType(authUserId: string): 'guest' | 'authenticated_user' {
  return authUserId ? 'authenticated_user' : 'guest'
}

function getNowIso() {
  return new Date().toISOString()
}

function appendTransitionHistory(entry: Record<string, unknown> | null | undefined, transition: Record<string, unknown>) {
  const meta = (entry?.caseMetadata ?? {}) as Record<string, unknown>
  const previous = Array.isArray(meta.transitionHistory) ? meta.transitionHistory as Record<string, unknown>[] : []
  return {
    ...meta,
    transitionHistory: [...previous, transition].slice(-40),
  }
}

function toCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value).replace(/"/g, '""').replace(/\r?\n/g, '\\n')
  return `"${text}"`
}

function toCsvRow(values: unknown[]): string {
  return values.map(toCsvCell).join(',')
}

function normalizeBooleanParam(value: unknown): boolean | undefined {
  if (value === undefined) return undefined
  const raw = String(value).trim().toLowerCase()
  if (raw === 'true' || raw === '1') return true
  if (raw === 'false' || raw === '0') return false
  return undefined
}

function parseDate(value: unknown): Date | null {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizeSort(sortBy: unknown, sortOrder: unknown): string {
  const allowed = new Set(['submittedAt', 'updatedAt', 'priority', 'status'])
  const by = String(sortBy ?? 'submittedAt')
  const order = String(sortOrder ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
  return `${allowed.has(by) ? by : 'submittedAt'}:${order}`
}

function parseTags(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildAutoReplySubject(locale: string, formType: string): string {
  if (locale === 'en') return `[mizzz] Thank you for your ${formType} inquiry`
  if (locale === 'ko') return `[mizzz] 문의 접수가 완료되었습니다 (${formType})`
  return `[mizzz] お問い合わせを受け付けました（${formType}）`
}

function buildAutoReplyText(params: {
  locale: string
  name: string
  formType: string
  inquiryCategory: string
  submittedAt: string
  subject: string
  referenceId: number | string
}): string {
  const { locale, name, formType, inquiryCategory, submittedAt, subject, referenceId } = params
  if (locale === 'en') {
    return [
      `Hello ${name || 'there'},`,
      '',
      'We have received your inquiry at mizzz.',
      `Reference ID: ${referenceId}`,
      `Type: ${formType} / ${inquiryCategory}`,
      `Submitted at: ${submittedAt}`,
      `Subject: ${subject || '-'}`,
      '',
      `Estimated reply time: within ${CONTACT_REPLY_DAYS} business days.`,
      'If this message was not sent by you, please ignore this email.',
      '',
      'mizzz contact desk',
    ].join('\n')
  }
  if (locale === 'ko') {
    return [
      `${name || '고객'}님 안녕하세요.`,
      '',
      'mizzz 문의가 정상적으로 접수되었습니다.',
      `접수번호: ${referenceId}`,
      `유형: ${formType} / ${inquiryCategory}`,
      `접수시각: ${submittedAt}`,
      `제목: ${subject || '-'}`,
      '',
      `답변 예상: 영업일 기준 ${CONTACT_REPLY_DAYS}일 이내`,
      '본인이 요청하지 않았다면 이 메일은 무시해 주세요.',
      '',
      'mizzz 문의팀',
    ].join('\n')
  }
  return [
    `${name || 'ご担当者'} 様`,
    '',
    'mizzz のお問い合わせを受け付けました。',
    `受付番号: ${referenceId}`,
    `種別: ${formType} / ${inquiryCategory}`,
    `受付日時: ${submittedAt}`,
    `件名: ${subject || '-'}`,
    '',
    `返信目安: ${CONTACT_REPLY_DAYS} 営業日以内`,
    'お心当たりのない場合は本メールを破棄してください。',
    '',
    'mizzz お問い合わせ窓口',
  ].join('\n')
}

async function sendNotificationMail(strapi: any, payload: {
  to: string[]
  subject: string
  text: string
  replyTo?: string
}): Promise<void> {
  if (!payload.to.length) return
  await strapi.plugin('email').service('email').send({
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    replyTo: payload.replyTo,
  })
}

function buildOpsFilters(query: Record<string, unknown>) {
  const filters: Record<string, unknown> = {}
  const text = String(query.q ?? '').trim()
  if (text) {
    filters.$or = [
      { email: { $containsi: text } },
      { name: { $containsi: text } },
      { subject: { $containsi: text } },
      { message: { $containsi: text } },
      { inquiryCategory: { $containsi: text } },
      { sourcePage: { $containsi: text } },
    ]
  }

  const directKeys = ['status', 'sourceSite', 'inquiryCategory', 'locale', 'priority', 'formType']
  directKeys.forEach((key) => {
    const value = String(query[key] ?? '').trim()
    if (value) filters[key] = value
  })

  const hasAttachment = normalizeBooleanParam(query.hasAttachment)
  if (hasAttachment === true) filters.attachmentCount = { $gt: 0 }
  if (hasAttachment === false) filters.attachmentCount = { $eq: 0 }

  const spamFlag = normalizeBooleanParam(query.spamFlag)
  if (spamFlag !== undefined) filters.spamFlag = spamFlag

  const dateFrom = parseDate(query.dateFrom)
  const dateTo = parseDate(query.dateTo)
  if (dateFrom || dateTo) {
    const submittedAt: Record<string, string> = {}
    if (dateFrom) submittedAt.$gte = dateFrom.toISOString()
    if (dateTo) submittedAt.$lte = dateTo.toISOString()
    filters.submittedAt = submittedAt
  }

  return filters
}

function assertOpsToken(ctx: any): boolean {
  const configured = String(process.env.INQUIRY_OPS_TOKEN ?? '').trim()
  if (!configured) return false
  const headerToken = String(ctx.request.headers['x-inquiry-ops-token'] ?? '').trim()
  const auth = String(ctx.request.headers.authorization ?? '').trim()
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const candidate = headerToken || bearer
  return candidate.length > 0 && candidate === configured
}

type UserCaseState = {
  caseStatus: string
  caseResolutionState: string
  caseVisibilityState: string
  selfServiceState: string
}

function toUserCaseState(entry: Record<string, unknown>): UserCaseState {
  const status = String(entry.status ?? 'new')
  const caseStatus = String(entry.caseStatus ?? (status === 'closed' ? 'closed' : status === 'replied' ? 'resolved' : status === 'waiting_reply' ? 'waiting_user' : status === 'in_review' ? 'triaging' : 'submitted'))
  const caseResolutionState = String(entry.caseResolutionState ?? (status === 'replied' || status === 'closed' ? 'support_resolved' : 'unresolved'))
  const caseVisibilityState = String(entry.caseVisibilityState ?? 'private_user')
  const selfServiceState = String(entry.selfServiceState ?? 'still_need_support')
  return { caseStatus, caseResolutionState, caseVisibilityState, selfServiceState }
}

function normalizeCaseEventType(value: unknown): 'user_message' | 'admin_reply' | 'system_message' | 'internal_note' | 'status_update' {
  const raw = String(value ?? '')
  if (raw === 'admin_reply' || raw === 'system_message' || raw === 'internal_note' || raw === 'status_update') return raw
  return 'user_message'
}

function normalizeCaseEventVisibility(value: unknown): 'user_visible' | 'support_only' | 'internal_only' {
  const raw = String(value ?? '')
  if (raw === 'support_only' || raw === 'internal_only') return raw
  return 'user_visible'
}

async function createSupportCaseEvent(strapi: any, input: {
  inquiryId: number
  eventType: 'user_message' | 'admin_reply' | 'system_message' | 'internal_note' | 'status_update'
  visibility: 'user_visible' | 'support_only' | 'internal_only'
  authorType: 'guest' | 'authenticated_user' | 'support' | 'internal_admin' | 'system'
  authorId?: string
  authorName?: string
  message?: string
  statusFrom?: string
  statusTo?: string
  timelineEvent?: string
  traceId?: string
  idempotencyKey?: string
  meta?: Record<string, unknown>
}) {
  return strapi.entityService.create('api::support-case-event.support-case-event', {
    data: {
      inquirySubmission: input.inquiryId,
      eventType: input.eventType,
      visibility: input.visibility,
      authorType: input.authorType,
      authorId: input.authorId ?? null,
      authorName: input.authorName ?? null,
      message: input.message ?? '',
      statusFrom: input.statusFrom ?? null,
      statusTo: input.statusTo ?? null,
      timelineEvent: input.timelineEvent ?? null,
      traceId: input.traceId ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      postedAt: new Date().toISOString(),
      meta: input.meta ?? {},
    },
  })
}

async function listSupportCaseEvents(strapi: any, inquiryId: number, visibility: Array<'user_visible' | 'support_only' | 'internal_only'>) {
  return strapi.entityService.findMany('api::support-case-event.support-case-event', {
    filters: {
      $and: [
        { inquirySubmission: { id: { $eq: inquiryId } } },
        { visibility: { $in: visibility } },
      ],
    },
    fields: ['eventType', 'visibility', 'authorType', 'authorId', 'authorName', 'message', 'statusFrom', 'statusTo', 'timelineEvent', 'postedAt', 'traceId'],
    sort: ['postedAt:asc', 'id:asc'],
    limit: 300,
  })
}

function resolveUnreadState(userCount: number, supportCount: number): 'none' | 'unread_for_user' | 'unread_for_support' | 'unread_both' {
  if (userCount > 0 && supportCount > 0) return 'unread_both'
  if (userCount > 0) return 'unread_for_user'
  if (supportCount > 0) return 'unread_for_support'
  return 'none'
}

async function updateUnreadState(strapi: any, inquiryId: number, next: { userCount?: number; supportCount?: number }) {
  const rows = await strapi.entityService.findMany('api::inquiry-submission.inquiry-submission', {
    filters: { id: { $eq: inquiryId } },
    fields: ['supportUnreadUserCount', 'supportUnreadSupportCount'],
    limit: 1,
  })
  const row = Array.isArray(rows) ? rows[0] as Record<string, unknown> : {}
  const userCount = Math.max(0, Number(next.userCount ?? row.supportUnreadUserCount ?? 0))
  const supportCount = Math.max(0, Number(next.supportCount ?? row.supportUnreadSupportCount ?? 0))
  await strapi.entityService.update('api::inquiry-submission.inquiry-submission', inquiryId, {
    data: {
      supportUnreadUserCount: userCount,
      supportUnreadSupportCount: supportCount,
      supportUnreadState: resolveUnreadState(userCount, supportCount),
    } as Record<string, unknown>,
  })
}

async function resolveMyInquiryFilter(ctx: any, strapi: any): Promise<Record<string, unknown>> {
  const authUser = await verifyAccessToken(ctx.request.headers.authorization)
  const appUsers = await strapi.entityService.findMany('api::app-user.app-user', {
    filters: {
      $or: [
        { authUserId: { $eq: authUser.userId } },
        { supabaseUserId: { $eq: authUser.userId } },
        { logtoUserId: { $eq: authUser.userId } },
      ],
    },
    fields: ['authUserId', 'supabaseUserId', 'logtoUserId', 'email', 'primaryEmail'],
    limit: 1,
  })

  const appUser = Array.isArray(appUsers) ? appUsers[0] : null
  const email = String(appUser?.email ?? appUser?.primaryEmail ?? authUser.email ?? '').trim().toLowerCase()
  const authUserId = String(appUser?.authUserId ?? appUser?.supabaseUserId ?? appUser?.logtoUserId ?? authUser.userId ?? '').trim()

  const orFilters: Record<string, unknown>[] = []
  if (email) orFilters.push({ email: { $eqi: email } })
  if (authUserId) orFilters.push({ authUserId: { $eq: authUserId } })
  if (orFilters.length === 0) throw new Error('問い合わせ履歴に紐づくユーザー識別子を解決できません。')

  return {
    $and: [
      { spamFlag: { $ne: true } },
      { caseVisibilityState: { $notIn: ['support_only', 'internal_only'] } },
      { $or: orFilters },
    ],
  }
}

export default factories.createCoreController(
  'api::inquiry-submission.inquiry-submission',
  ({ strapi }) => ({
    async publicSubmit(ctx) {
      const requestId = getOrCreateRequestId(ctx)
      const body = ctx.request.body ?? {}
      const files = toArray<any>(ctx.request.files?.attachments)

      const formType = normalizeText(body.formType, 32).toLowerCase()
      const email = normalizeText(body.email, 200)
      const name = normalizeText(body.name, 200)
      const subject = normalizeText(body.subject, 200)
      const message = normalizeText(body.message, 8000)
      const policyAgree = String(body.policyAgree ?? '') === 'true'
      const honeypot = normalizeText(body.website, 100)
      const sourceSite = normalizeSourceSite(String(body.sourceSite ?? 'unknown'))
      const sourcePage = normalizeText(body.sourcePage, 500)
      const locale = normalizeLocale(String(body.locale ?? 'ja'))
      const requestType = normalizeText(body.requestType, 80)
      const definitions = await loadActiveFormDefinitions(strapi)
      const formDefinition = selectFormDefinition(formType, sourceSite, definitions)
      const allowedFormTypes = new Set(definitions.map((item) => item.formType))
      const isAllowedType = allowedFormTypes.size > 0 ? allowedFormTypes.has(formType) : FALLBACK_FORM_TYPES.has(formType)

      if (!isAllowedType) {
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

      const allowAttachment = Boolean(formDefinition?.attachmentEnabled ?? true)
      const maxFiles = Number(formDefinition?.maxFiles ?? MAX_FILES)
      const maxFileBytes = Number(formDefinition?.maxFileSize ?? MAX_FILE_BYTES)
      const allowedMimes = new Set(Array.isArray(formDefinition?.allowedMimeTypes) && formDefinition.allowedMimeTypes.length > 0
        ? formDefinition.allowedMimeTypes
        : Array.from(ALLOWED_MIME_TYPES))

      if (!allowAttachment && files.length > 0) {
        return ctx.badRequest('このフォームでは添付ファイルを利用できません')
      }

      if (files.length > maxFiles) {
        return ctx.badRequest(`添付ファイルは最大 ${maxFiles} 件までです`)
      }

      for (const file of files) {
        const fileName = normalizeText(file.name, 260)
        const ext = extensionFromFilename(fileName)
        if (file.size > maxFileBytes) {
          return ctx.badRequest(`ファイルサイズ上限は ${maxFileBytes} bytes です`)
        }
        if (!allowedMimes.has(file.type) || !ALLOWED_FILE_EXTENSIONS.has(ext)) {
          return ctx.badRequest(`許可されていないファイル形式です: ${file.type} (${ext || 'no-ext'})`)
        }
      }

      const userAgent = normalizeText(ctx.request.headers['user-agent'], 500)
      const ipHash = hashIp(getClientIp(ctx))
      const burstSpam = checkSpamBurst(ipHash)
      const payloadHash = createHash('sha256').update(`${email}|${subject}|${message}|${sourceSite}|${sourcePage}`).digest('hex')
      const duplicatePayload = checkDuplicate(payloadHash)
      const spamAssessment = scoreSpam({
        honeypot,
        email,
        subject,
        message,
        userAgent,
        duplicate: duplicatePayload,
      })
      const spamScore = spamAssessment.score + (burstSpam ? 10 : 0)
      const isSpam = burstSpam || spamScore >= 5
      const fallbackCategory = String(formDefinition?.defaultCategory ?? '')
      const inquiryCategory = normalizeCategory(sourceSite, formType, String(body.inquiryCategory ?? fallbackCategory), requestType)
      let authUserId = ''
      try {
        const authUser = await verifyAccessToken(ctx.request.headers.authorization)
        authUserId = String(authUser.userId ?? '').trim()
      } catch {
        authUserId = ''
      }

      const uploaded = files.length
        ? await strapi.plugin('upload').service('upload').upload({
            data: {},
            files,
          })
        : []

      const submittedAt = getNowIso()
      const requesterType = mapRequesterType(authUserId)
      const created = await strapi.entityService.create('api::inquiry-submission.inquiry-submission', {
        data: {
          formType,
          inquiryCategory,
          name,
          companyOrOrganization: normalizeText(body.companyOrOrganization, 200),
          email,
          phone: normalizeText(body.phone, 80),
          subject,
          message,
          attachments: uploaded.map((item: any) => item.id),
          attachmentCount: uploaded.length,
          attachmentMetadata: buildAttachmentMeta(uploaded),
          locale,
          sourcePage,
          sourceSite,
          inquiryTraceId: requestId,
          requesterType,
          supportRequesterType: requesterType,
          authUserId: authUserId || undefined,
          supportRequesterId: authUserId || undefined,
          status: isSpam ? 'spam' : String(formDefinition?.initialStatus ?? 'new'),
          priority: isSpam ? 'low' : String(formDefinition?.initialPriority ?? 'normal'),
          caseStatus: isSpam ? 'closed' : 'submitted',
          caseResolutionState: 'unresolved',
          caseVisibilityState: 'private_user',
          selfServiceState: 'still_need_support',
          submittedAt,
          lastActionAt: submittedAt,
          lastUserActionAt: submittedAt,
          supportThreadState: isSpam ? 'closed' : 'open',
          supportWaitingState: isSpam ? 'none' : 'waiting_support',
          supportUnreadState: 'unread_for_support',
          supportUnreadSupportCount: 1,
          supportUnreadUserCount: 0,
          supportAcknowledgementState: 'unacknowledged',
          supportNotificationState: 'idle',
          supportLastReplyAt: submittedAt,
          supportLastUserReplyAt: submittedAt,
          replyStatus: formType === 'restock' ? 'not_required' : 'pending',
          ipHash,
          userAgent,
          policyAgree,
          consentTextVersion: normalizeText(body.consentTextVersion, 80) || 'v1',
          spamFlag: isSpam,
          spamScore,
          spamReason: burstSpam ? 'burst_limit' : spamAssessment.reason,
          meta: {
            requestType,
            budget: normalizeText(body.budget, 120),
            deadline: normalizeText(body.deadline, 120),
            productId: normalizeText(body.productId, 80),
            productSlug: normalizeText(body.productSlug, 160),
            productTitle: normalizeText(body.productTitle, 200),
          },
          caseMetadata: {
            supportCaseType: inquiryCategory,
            sourceSite,
            locale,
            transitionHistory: [{
              at: submittedAt,
              actorType: 'user',
              action: 'submitted',
              status: isSpam ? 'spam' : 'new',
              caseStatus: isSpam ? 'closed' : 'submitted',
              note: 'public submit',
            }],
          },
        },
      })
      const inquiryNumber = buildInquiryNumber(sourceSite, submittedAt, created.id)
      await strapi.entityService.update('api::inquiry-submission.inquiry-submission', created.id, {
        data: {
          inquiryNumber,
        } as Record<string, unknown>,
      })
      const entry = { ...created, inquiryNumber }
      await createSupportCaseEvent(strapi, {
        inquiryId: Number(entry.id),
        eventType: 'user_message',
        visibility: 'user_visible',
        authorType: requesterType === 'guest' ? 'guest' : 'authenticated_user',
        authorId: authUserId || undefined,
        authorName: name || undefined,
        message: message || subject || '(no message)',
        timelineEvent: 'case_submitted',
        traceId: requestId,
      }).catch(() => undefined)

      const notifyTo = resolveNotificationTargets(formDefinition, sourceSite)

      const notifySubject = `[mizzz][${sourceSite}] 新規問い合わせ #${entry.id} ${inquiryCategory}`
      const notifyText = [
        `id: ${entry.id}`,
        `status: ${isSpam ? 'spam' : 'new'}`,
        `formType: ${formType}`,
        `category: ${inquiryCategory}`,
        `sourceSite: ${sourceSite}`,
        `sourcePage: ${sourcePage || '-'}`,
        `locale: ${locale}`,
        `name: ${name || '-'}`,
        `email: ${email}`,
        `subject: ${subject || '-'}`,
        `attachmentCount: ${uploaded.length}`,
        `submittedAt: ${submittedAt}`,
        '',
        'message:',
        message || '-',
      ].join('\n')

      let notificationState: 'not_configured' | 'sent' | 'failed' | 'unknown' = 'unknown'
      let deliveryState: 'not_sent' | 'queued' | 'delivered' | 'failed' | 'unknown' = 'unknown'
      let notificationErrorMessage = ''

      if (notifyTo.length === 0) {
        notificationState = 'not_configured'
        deliveryState = 'unknown'
      } else {
        try {
          await sendNotificationMail(strapi, {
            to: notifyTo,
            subject: notifySubject,
            text: notifyText,
            replyTo: email,
          })
          notificationState = 'sent'
          deliveryState = 'delivered'
        } catch (error) {
          notificationState = 'failed'
          deliveryState = 'failed'
          notificationErrorMessage = (error as Error).message
          strapi.log.error(withRequestId(`[inquiry-submission] notify mail failed id=${entry.id}: ${(error as Error).message}`, requestId))
        }
      }

      const envAutoReply = String(process.env.INQUIRY_ENABLE_AUTO_REPLY ?? 'false').toLowerCase() === 'true'
      const enableAutoReply = (formDefinition?.autoReplyEnabled ?? true) && envAutoReply
      if (enableAutoReply && formType !== 'restock' && !isSpam) {
        try {
          await sendNotificationMail(strapi, {
            to: [email],
            subject: buildAutoReplySubject(locale, formType),
            text: buildAutoReplyText({
              locale,
              name,
              formType,
              inquiryCategory,
              submittedAt,
              subject,
              referenceId: inquiryNumber,
            }),
          })
        } catch (error) {
          strapi.log.error(withRequestId(`[inquiry-submission] auto-reply failed id=${entry.id}: ${(error as Error).message}`, requestId))
        }
      }

      const submitState = 'succeeded'
      const resultState = notificationState === 'failed' ? 'delivery_error' : 'success'

      await strapi.entityService.update('api::inquiry-submission.inquiry-submission', entry.id, {
        data: {
          notificationState,
          adminReviewState: isSpam ? 'spam' : 'new',
        } as Record<string, unknown>,
      }).catch(() => undefined)

      ctx.body = {
        data: {
          id: entry.id,
          inquiryNumber,
          inquiryTraceId: requestId,
          status: isSpam ? 'spam' : 'new',
          submittedAt,
          requestId,
          inquirySubmitState: submitState,
          inquiryDeliveryState: deliveryState,
          inquiryResultState: resultState,
          inquiryRequesterType: requesterType,
          inquiryReceivedAt: submittedAt,
          inquiryConfirmedAt: submittedAt,
          inquirySentAt: submittedAt,
          inquiryFailedAt: notificationState === 'failed' ? submittedAt : null,
          inquiryNotificationState: notificationState,
          inquiryStorageState: 'stored',
          inquiryAdminReviewState: isSpam ? 'spam' : 'new',
          inquiryErrorState: notificationState === 'failed'
            ? { type: 'notification', message: notificationErrorMessage || 'notify failed' }
            : null,
        },
      }
    },

    async publicTrack(ctx) {
      const inquiryNumber = normalizeText(ctx.query.inquiryNumber, 64)
      const email = normalizeText(ctx.query.email, 200).toLowerCase()
      if (!inquiryNumber || !email) return ctx.badRequest('inquiryNumber と email は必須です')

      const entries = await strapi.entityService.findMany('api::inquiry-submission.inquiry-submission', {
        filters: {
          $and: [
            { inquiryNumber: { $eq: inquiryNumber } },
            { email: { $eqi: email } },
          ],
        },
        fields: ['inquiryNumber', 'inquiryTraceId', 'formType', 'inquiryCategory', 'subject', 'status', 'sourceSite', 'submittedAt', 'updatedAt', 'caseStatus', 'caseResolutionState', 'replyStatus', 'notificationState'],
        limit: 1,
      })
      const item = Array.isArray(entries) ? entries[0] : null
      if (!item) return ctx.notFound('問い合わせが見つかりません')

      ctx.body = {
        data: {
          inquiryNumber: item.inquiryNumber,
          inquiryTraceId: item.inquiryTraceId ?? null,
          formType: item.formType,
          supportCaseType: item.inquiryCategory ?? 'other',
          subject: item.subject ?? '',
          sourceSite: item.sourceSite ?? 'main',
          submittedAt: item.submittedAt,
          updatedAt: item.updatedAt,
          replyStatus: item.replyStatus ?? 'pending',
          notificationState: item.notificationState ?? 'unknown',
          ...toUserCaseState(item as Record<string, unknown>),
        },
      }
    },

    async mySummary(ctx) {
      try {
        const filters = await resolveMyInquiryFilter(ctx, strapi)
        const rows = await strapi.entityService.findMany('api::inquiry-submission.inquiry-submission', {
          filters,
          fields: ['status', 'priority', 'sourceSite', 'inquiryCategory', 'submittedAt', 'updatedAt', 'resolvedAt', 'caseStatus', 'caseResolutionState', 'caseVisibilityState', 'selfServiceState'],
          sort: 'submittedAt:desc',
          limit: MY_SUMMARY_MAX_ROWS,
        })
        const list = (rows as Array<Record<string, unknown>>).map((row) => ({
          ...toUserCaseState(row),
          priority: String(row.priority ?? 'normal'),
          sourceSite: String(row.sourceSite ?? 'main'),
          inquiryCategory: String(row.inquiryCategory ?? 'general'),
          submittedAt: String(row.submittedAt ?? ''),
          updatedAt: String(row.updatedAt ?? row.submittedAt ?? ''),
          resolvedAt: row.resolvedAt ? String(row.resolvedAt) : null,
        }))
        const openStatuses = new Set(['submitted', 'triaging', 'waiting_user', 'in_progress', 'reopened'])
        const unresolved = list.filter((row) => row.caseResolutionState === 'unresolved').length
        const openCases = list.filter((row) => openStatuses.has(row.caseStatus)).length
        const waitingUser = list.filter((row) => row.caseStatus === 'waiting_user').length
        const selfResolved = list.filter((row) => row.caseResolutionState === 'self_resolved').length

        ctx.body = {
          data: {
            openCases,
            waitingUser,
            unresolved,
            selfResolved,
            total: list.length,
            recent: list.slice(0, 3),
          },
        }
      } catch (error) {
        return ctx.unauthorized((error as Error).message)
      }
    },

    async myHistory(ctx) {
      try {
        const filters = await resolveMyInquiryFilter(ctx, strapi)
        const page = Math.max(1, Number(ctx.query.page ?? 1))
        const pageSize = Math.min(MY_HISTORY_PAGE_MAX, Math.max(1, Number(ctx.query.pageSize ?? 12)))
        const statusFilter = normalizeText(ctx.query.caseStatus, 40)
        const categoryFilter = normalizeText(ctx.query.supportCaseType, 60)
        const scopedFilters: Record<string, unknown> = { ...filters }
        if (statusFilter) (scopedFilters as any).caseStatus = { $eq: statusFilter }
        if (categoryFilter) (scopedFilters as any).inquiryCategory = { $eq: categoryFilter }

        const [rows, total] = await Promise.all([
          strapi.entityService.findMany('api::inquiry-submission.inquiry-submission', {
            filters: scopedFilters,
            fields: ['formType', 'inquiryCategory', 'subject', 'message', 'status', 'priority', 'sourceSite', 'submittedAt', 'updatedAt', 'resolvedAt', 'repliedAt', 'attachmentCount', 'replyStatus', 'caseStatus', 'caseResolutionState', 'caseVisibilityState', 'selfServiceState', 'inquiryNumber', 'inquiryTraceId', 'requesterType', 'supportLastReplyAt', 'supportLastUserReplyAt', 'supportLastAdminReplyAt', 'supportUnreadState', 'supportUnreadUserCount'],
            sort: 'submittedAt:desc',
            start: (page - 1) * pageSize,
            limit: pageSize,
          }),
          strapi.entityService.count('api::inquiry-submission.inquiry-submission', { filters: scopedFilters }),
        ])

        ctx.body = {
          data: (rows as Array<Record<string, unknown>>).map((row) => ({
            id: row.id,
            inquiryNumber: row.inquiryNumber ?? `TEMP-${row.id}`,
            inquiryTraceId: row.inquiryTraceId ?? null,
            formType: row.formType,
            supportCaseType: row.inquiryCategory ?? 'other',
            subject: row.subject ?? '',
            messagePreview: String(row.message ?? '').slice(0, 140),
            priority: row.priority ?? 'normal',
            sourceSite: row.sourceSite ?? 'main',
            submittedAt: row.submittedAt,
            updatedAt: row.updatedAt,
            resolvedAt: row.resolvedAt ?? null,
            repliedAt: row.repliedAt ?? null,
            supportLastReplyAt: row.supportLastReplyAt ?? null,
            supportLastUserReplyAt: row.supportLastUserReplyAt ?? null,
            supportLastAdminReplyAt: row.supportLastAdminReplyAt ?? null,
            supportUnreadState: row.supportUnreadState ?? 'none',
            supportUnreadUserCount: Number(row.supportUnreadUserCount ?? 0),
            attachmentCount: row.attachmentCount ?? 0,
            replyStatus: row.replyStatus ?? 'pending',
            requesterType: row.requesterType ?? 'guest',
            ...toUserCaseState(row),
          })),
          meta: {
            pagination: {
              page,
              pageSize,
              pageCount: Math.max(1, Math.ceil(total / pageSize)),
              total,
            },
          },
        }
      } catch (error) {
        return ctx.unauthorized((error as Error).message)
      }
    },

    async myDetail(ctx) {
      try {
        const id = Number(ctx.params.id)
        if (!Number.isInteger(id) || id <= 0) return ctx.badRequest('id が不正です')
        const filters = await resolveMyInquiryFilter(ctx, strapi)
        const entries = await strapi.entityService.findMany('api::inquiry-submission.inquiry-submission', {
          filters: { $and: [filters, { id: { $eq: id } }] },
          fields: ['formType', 'inquiryCategory', 'subject', 'message', 'status', 'priority', 'sourceSite', 'sourcePage', 'locale', 'submittedAt', 'updatedAt', 'resolvedAt', 'repliedAt', 'attachmentCount', 'replyStatus', 'caseStatus', 'caseResolutionState', 'caseVisibilityState', 'selfServiceState', 'firstResponseAt', 'lastUserActionAt', 'lastSupportActionAt', 'inquiryNumber', 'inquiryTraceId', 'requesterType', 'notificationState', 'supportLastReplyAt', 'supportLastUserReplyAt', 'supportLastAdminReplyAt', 'supportUnreadState', 'supportUnreadUserCount'],
          limit: 1,
        })
        const item = Array.isArray(entries) ? entries[0] : null
        if (!item) return ctx.notFound('case が見つかりません')
        const timelineRows = await listSupportCaseEvents(strapi, id, ['user_visible'])
        const timeline = (Array.isArray(timelineRows) ? timelineRows : []).map((event: Record<string, unknown>) => ({
          id: event.id,
          supportReplyType: normalizeCaseEventType(event.eventType),
          supportReplyVisibility: normalizeCaseEventVisibility(event.visibility),
          supportReplyAuthorType: String(event.authorType ?? 'system'),
          supportReplyAuthorId: event.authorId ?? null,
          supportReplyAuthorName: event.authorName ?? null,
          supportReplyBody: event.message ?? '',
          supportReplyPostedAt: event.postedAt ?? null,
          supportReplyState: 'active',
          supportReplyTraceId: event.traceId ?? null,
          supportTimelineEvent: event.timelineEvent ?? null,
          supportStatusFrom: event.statusFrom ?? null,
          supportStatusTo: event.statusTo ?? null,
        }))
        await updateUnreadState(strapi, id, { userCount: 0 }).catch(() => undefined)
        ctx.body = { data: { ...item, supportCaseType: item.inquiryCategory ?? 'other', supportTimeline: timeline, ...toUserCaseState(item as Record<string, unknown>) } }
      } catch (error) {
        return ctx.unauthorized((error as Error).message)
      }
    },

    async postMyReply(ctx) {
      try {
        const id = Number(ctx.params.id)
        if (!Number.isInteger(id) || id <= 0) return ctx.badRequest('id が不正です')
        const body = (ctx.request.body ?? {}) as Record<string, unknown>
        const message = normalizeText(body.message, CASE_REPLY_MAX_LENGTH)
        if (!message) return ctx.badRequest('message は必須です')
        const idempotencyKey = normalizeText(body.idempotencyKey, 100)
        const traceId = normalizeText(body.traceId, 120) || getOrCreateRequestId(ctx)
        const filters = await resolveMyInquiryFilter(ctx, strapi)
        const entries = await strapi.entityService.findMany('api::inquiry-submission.inquiry-submission', {
          filters: { $and: [filters, { id: { $eq: id } }] },
          fields: ['name', 'authUserId', 'caseStatus', 'caseMetadata', 'supportUnreadSupportCount'],
          limit: 1,
        })
        const item = Array.isArray(entries) ? entries[0] as Record<string, unknown> : null
        if (!item) return ctx.notFound('case が見つかりません')
        if (idempotencyKey) {
          const dup = await strapi.entityService.findMany('api::support-case-event.support-case-event', {
            filters: { $and: [{ inquirySubmission: { id: { $eq: id } } }, { idempotencyKey: { $eq: idempotencyKey } }] },
            fields: ['id'],
            limit: 1,
          })
          if (Array.isArray(dup) && dup.length > 0) return ctx.body = { data: { accepted: true, duplicated: true } }
        }
        await createSupportCaseEvent(strapi, {
          inquiryId: id,
          eventType: 'user_message',
          visibility: 'user_visible',
          authorType: 'authenticated_user',
          authorId: String(item.authUserId ?? ''),
          authorName: String(item.name ?? ''),
          message,
          timelineEvent: 'user_reply',
          traceId,
          idempotencyKey: idempotencyKey || undefined,
        })
        const now = new Date().toISOString()
        await strapi.entityService.update('api::inquiry-submission.inquiry-submission', id, {
          data: {
            caseStatus: ['resolved', 'closed'].includes(String(item.caseStatus ?? '')) ? 'reopened' : 'in_progress',
            caseResolutionState: 'unresolved',
            status: 'in_review',
            supportThreadState: 'open',
            supportWaitingState: 'waiting_support',
            supportLastReplyAt: now,
            supportLastUserReplyAt: now,
            lastActionAt: now,
            lastUserActionAt: now,
            supportAcknowledgementState: 'acknowledged_by_user',
            caseMetadata: appendTransitionHistory(item, { at: now, actorType: 'user', action: 'reply', caseStatus: 'in_progress' }),
          } as Record<string, unknown>,
        })
        await updateUnreadState(strapi, id, { supportCount: Number(item.supportUnreadSupportCount ?? 0) + 1 }).catch(() => undefined)
        ctx.body = { data: { accepted: true, postedAt: now, supportReplyType: 'user_message' } }
      } catch (error) {
        return ctx.unauthorized((error as Error).message)
      }
    },

    async reopenMyCase(ctx) {
      try {
        const id = Number(ctx.params.id)
        if (!Number.isInteger(id) || id <= 0) return ctx.badRequest('id が不正です')
        const filters = await resolveMyInquiryFilter(ctx, strapi)
        const entries = await strapi.entityService.findMany('api::inquiry-submission.inquiry-submission', {
          filters: { $and: [filters, { id: { $eq: id } }] },
          fields: ['caseStatus', 'caseMetadata'],
          limit: 1,
        })
        const item = Array.isArray(entries) ? entries[0] : null
        if (!item) return ctx.notFound('case が見つかりません')

        const current = String(item.caseStatus ?? '')
        if (!['resolved', 'closed'].includes(current)) {
          return ctx.badRequest('resolved / closed の case のみ再オープンできます')
        }

        const now = new Date().toISOString()
        await strapi.entityService.update('api::inquiry-submission.inquiry-submission', id, {
          data: {
            caseStatus: 'reopened',
            caseResolutionState: 'unresolved',
            status: 'in_review',
            replyStatus: 'pending',
            lastActionAt: now,
            lastUserActionAt: now,
            adminReviewState: 'triaging',
            caseMetadata: appendTransitionHistory(item as Record<string, unknown>, {
              at: now,
              actorType: 'user',
              action: 'reopen',
              caseStatus: 'reopened',
            }),
          } as Record<string, unknown>,
        })

        ctx.body = { data: { id, caseStatus: 'reopened', caseResolutionState: 'unresolved' } }
      } catch (error) {
        return ctx.unauthorized((error as Error).message)
      }
    },

    async opsSummary(ctx) {
      if (!assertOpsToken(ctx)) return ctx.unauthorized('ops token が不正です')

      const now = new Date()
      const startOfToday = new Date(now)
      startOfToday.setUTCHours(0, 0, 0, 0)
      const startOfWeek = new Date(now)
      startOfWeek.setUTCDate(now.getUTCDate() - 6)
      startOfWeek.setUTCHours(0, 0, 0, 0)

      const [total, today, week, unhandled, spam, closed, byStatus] = await Promise.all([
        strapi.entityService.count('api::inquiry-submission.inquiry-submission', { filters: {} }),
        strapi.entityService.count('api::inquiry-submission.inquiry-submission', { filters: { submittedAt: { $gte: startOfToday.toISOString() } } }),
        strapi.entityService.count('api::inquiry-submission.inquiry-submission', { filters: { submittedAt: { $gte: startOfWeek.toISOString() } } }),
        strapi.entityService.count('api::inquiry-submission.inquiry-submission', { filters: { status: { $in: ['new', 'in_review', 'waiting_reply'] } } }),
        strapi.entityService.count('api::inquiry-submission.inquiry-submission', { filters: { status: 'spam' } }),
        strapi.entityService.count('api::inquiry-submission.inquiry-submission', { filters: { status: 'closed' } }),
        strapi.entityService.findMany('api::inquiry-submission.inquiry-submission', {
          fields: ['status'],
          start: 0,
          limit: 5000,
        }),
      ])

      const statusCounts = (byStatus as Array<{ status?: string }>).reduce<Record<string, number>>((acc, item) => {
        const key = item.status ?? 'unknown'
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {})

      ctx.body = {
        data: {
          total,
          today,
          week,
          unhandled,
          spam,
          closed,
          statusCounts,
        },
      }
    },

    async opsList(ctx) {
      if (!assertOpsToken(ctx)) return ctx.unauthorized('ops token が不正です')

      const query = ctx.query as Record<string, unknown>
      const page = Math.max(1, Number(query.page ?? 1))
      const pageSize = Math.min(200, Math.max(1, Number(query.pageSize ?? 50)))
      const filters = buildOpsFilters(query)
      const sort = normalizeSort(query.sortBy, query.sortOrder)

      const [data, total] = await Promise.all([
        strapi.entityService.findMany('api::inquiry-submission.inquiry-submission', {
          filters,
          sort,
          fields: [
            'formType', 'inquiryCategory', 'name', 'email', 'subject', 'status', 'priority', 'sourceSite', 'sourcePage', 'locale',
            'attachmentCount', 'spamFlag', 'spamReason', 'submittedAt', 'updatedAt', 'handledAt', 'handler', 'replyStatus', 'repliedAt', 'lastActionAt',
            'inquiryNumber', 'inquiryTraceId', 'requesterType', 'notificationState', 'caseStatus', 'caseResolutionState', 'assignmentState', 'adminReviewState',
          ],
          start: (page - 1) * pageSize,
          limit: pageSize,
        }),
        strapi.entityService.count('api::inquiry-submission.inquiry-submission', { filters }),
      ])

      ctx.body = {
        data,
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: Math.max(1, Math.ceil(total / pageSize)),
            total,
          },
          sort,
        },
      }
    },

    async opsExportCsv(ctx) {
      if (!assertOpsToken(ctx)) return ctx.unauthorized('ops token が不正です')

      const query = ctx.query as Record<string, unknown>
      const filters = buildOpsFilters(query)
      const sort = normalizeSort(query.sortBy, query.sortOrder)

      const rows = await strapi.entityService.findMany('api::inquiry-submission.inquiry-submission', {
        filters,
        sort,
        fields: [
          'submittedAt', 'status', 'priority', 'sourceSite', 'sourcePage', 'locale', 'inquiryCategory', 'formType',
          'name', 'companyOrOrganization', 'email', 'phone', 'subject', 'message', 'attachmentCount',
          'spamFlag', 'handler', 'repliedAt', 'updatedAt',
        ],
        start: 0,
        limit: 10000,
      })

      const headers = [
        'id', 'submittedAt', 'status', 'priority', 'sourceSite', 'sourcePage', 'locale', 'inquiryCategory', 'formType',
        'name', 'companyOrOrganization', 'email', 'phone', 'subject', 'message', 'attachmentCount', 'spamFlag', 'handler', 'repliedAt', 'updatedAt',
      ]

      const csv = [
        toCsvRow(headers),
        ...(rows as Array<Record<string, unknown>>).map((row) =>
          toCsvRow([
            row.id,
            row.submittedAt,
            row.status,
            row.priority,
            row.sourceSite,
            row.sourcePage,
            row.locale,
            row.inquiryCategory,
            row.formType,
            row.name,
            row.companyOrOrganization,
            row.email,
            row.phone,
            row.subject,
            row.message,
            row.attachmentCount,
            row.spamFlag,
            row.handler,
            row.repliedAt,
            row.updatedAt,
          ]),
        ),
      ].join('\n')

      ctx.set('Content-Type', 'text/csv; charset=utf-8')
      ctx.set('Content-Disposition', `attachment; filename="inquiry-submissions-${new Date().toISOString().slice(0, 10)}.csv"`)
      ctx.body = `\uFEFF${csv}`
    },

    async opsBulkUpdate(ctx) {
      if (!assertOpsToken(ctx)) return ctx.unauthorized('ops token が不正です')

      const body = (ctx.request.body ?? {}) as Record<string, unknown>
      const ids = toArray(body.ids).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
      if (ids.length === 0) return ctx.badRequest('ids が不正です')

      const now = new Date().toISOString()
      const status = normalizeText(body.status, 40)
      const priority = normalizeText(body.priority, 20)
      const adminMemo = normalizeText(body.adminMemo, 6000)
      const handler = normalizeText(body.handler, 120)
      const internalTags = parseTags(body.internalTags)

      const updateData: Record<string, unknown> = { lastActionAt: now }
      if (status) {
        updateData.status = status
        if (['in_review', 'waiting_reply', 'replied', 'closed'].includes(status)) updateData.handledAt = now
        if (['in_review', 'waiting_reply', 'replied', 'closed'].includes(status) && !body.firstReviewedAt) updateData.firstReviewedAt = now
        if (['in_review', 'waiting_reply', 'replied', 'closed'].includes(status)) updateData.acknowledgedAt = now
        if (['in_review'].includes(status)) updateData.caseStatus = 'triaging'
        if (['waiting_reply'].includes(status)) updateData.caseStatus = 'waiting_user'
        if (['replied'].includes(status)) {
          updateData.caseStatus = 'resolved'
          updateData.caseResolutionState = 'support_resolved'
          updateData.firstResponseAt = now
          updateData.resolvedAt = now
          updateData.lastSupportActionAt = now
        }
        if (['closed'].includes(status)) {
          updateData.caseStatus = 'closed'
          updateData.caseResolutionState = 'support_resolved'
          updateData.resolvedAt = now
          updateData.closedAt = now
          updateData.lastSupportActionAt = now
        }
        if (status === 'replied') {
          updateData.replyStatus = 'replied'
          updateData.repliedAt = now
        }
        if (status === 'failed') {
          updateData.replyStatus = 'failed'
        }
      }
      if (priority) updateData.priority = priority
      if (adminMemo) updateData.adminMemo = adminMemo
      if (handler) updateData.handler = handler
      if (internalTags.length) updateData.internalTags = internalTags
      if (handler) updateData.assignmentState = 'assigned'
      if (adminMemo) updateData.internalNoteState = 'updated'
      if (status === 'spam') updateData.adminReviewState = 'spam'
      else if (status === 'closed') updateData.adminReviewState = 'closed'
      else if (status === 'replied') updateData.adminReviewState = 'resolved'
      else if (status === 'in_review' || status === 'waiting_reply') updateData.adminReviewState = 'triaging'

      let updated = 0
      for (const id of ids) {
        const entries = await strapi.entityService.findMany('api::inquiry-submission.inquiry-submission', {
          filters: { id: { $eq: id } },
          fields: ['caseMetadata'],
          limit: 1,
        })
        const current = Array.isArray(entries) ? entries[0] as Record<string, unknown> : null
        const nextData = {
          ...updateData,
          caseMetadata: appendTransitionHistory(current, {
            at: now,
            actorType: 'support',
            action: 'ops_bulk_update',
            status: status || null,
            priority: priority || null,
            handler: handler || null,
          }),
        }

        await strapi.entityService.update('api::inquiry-submission.inquiry-submission', id, {
          data: nextData as Record<string, unknown>,
        }).catch(() => undefined)
        updated += 1
      }

      ctx.body = { data: { updated, ids } }
    },

    async opsCaseMessages(ctx) {
      if (!assertOpsToken(ctx)) return ctx.unauthorized('ops token が不正です')
      const id = Number(ctx.params.id)
      if (!Number.isInteger(id) || id <= 0) return ctx.badRequest('id が不正です')
      const visibilityRaw = normalizeText(ctx.query.visibility, 64)
      const visibility = visibilityRaw === 'internal' ? ['user_visible', 'support_only', 'internal_only'] as const : ['user_visible', 'support_only'] as const
      const events = await listSupportCaseEvents(strapi, id, [...visibility])
      ctx.body = { data: events }
    },

    async opsReply(ctx) {
      if (!assertOpsToken(ctx)) return ctx.unauthorized('ops token が不正です')
      const id = Number(ctx.params.id)
      if (!Number.isInteger(id) || id <= 0) return ctx.badRequest('id が不正です')
      const body = (ctx.request.body ?? {}) as Record<string, unknown>
      const replyText = normalizeText(body.message, CASE_REPLY_MAX_LENGTH)
      if (!replyText) return ctx.badRequest('message は必須です')
      const traceId = normalizeText(body.traceId, 120) || getOrCreateRequestId(ctx)
      const actorName = normalizeText(body.actorName, 120) || 'support'
      const statusTo = normalizeText(body.statusTo, 40) || 'waiting_reply'
      const entries = await strapi.entityService.findMany('api::inquiry-submission.inquiry-submission', { filters: { id: { $eq: id } }, fields: ['caseMetadata', 'caseStatus'], limit: 1 })
      const item = Array.isArray(entries) ? entries[0] as Record<string, unknown> : null
      if (!item) return ctx.notFound('case が見つかりません')
      await createSupportCaseEvent(strapi, {
        inquiryId: id,
        eventType: 'admin_reply',
        visibility: 'user_visible',
        authorType: 'support',
        authorName: actorName,
        message: replyText,
        statusFrom: String(item.caseStatus ?? ''),
        statusTo,
        timelineEvent: 'support_reply',
        traceId,
      })
      const now = new Date().toISOString()
      await strapi.entityService.update('api::inquiry-submission.inquiry-submission', id, {
        data: {
          status: statusTo === 'resolved' || statusTo === 'closed' ? 'replied' : 'waiting_reply',
          caseStatus: statusTo,
          supportThreadState: statusTo === 'closed' ? 'closed' : statusTo === 'resolved' ? 'resolved' : 'waiting_user',
          supportWaitingState: statusTo === 'closed' || statusTo === 'resolved' ? 'none' : 'waiting_user',
          replyStatus: 'replied',
          repliedAt: now,
          firstResponseAt: now,
          lastActionAt: now,
          lastSupportActionAt: now,
          supportLastReplyAt: now,
          supportLastAdminReplyAt: now,
          supportAcknowledgementState: 'acknowledged_by_support',
          supportResolvedAt: statusTo === 'resolved' || statusTo === 'closed' ? now : null,
          supportClosedAt: statusTo === 'closed' ? now : null,
          caseMetadata: appendTransitionHistory(item, { at: now, actorType: 'support', action: 'reply', caseStatus: statusTo }),
        } as Record<string, unknown>,
      })
      await updateUnreadState(strapi, id, { userCount: 1, supportCount: 0 }).catch(() => undefined)
      ctx.body = { data: { id, repliedAt: now, caseStatus: statusTo } }
    },

    async opsInternalNote(ctx) {
      if (!assertOpsToken(ctx)) return ctx.unauthorized('ops token が不正です')
      const id = Number(ctx.params.id)
      if (!Number.isInteger(id) || id <= 0) return ctx.badRequest('id が不正です')
      const body = (ctx.request.body ?? {}) as Record<string, unknown>
      const note = normalizeText(body.note, CASE_REPLY_MAX_LENGTH)
      if (!note) return ctx.badRequest('note は必須です')
      const actorName = normalizeText(body.actorName, 120) || 'internal'
      await createSupportCaseEvent(strapi, {
        inquiryId: id,
        eventType: 'internal_note',
        visibility: 'internal_only',
        authorType: 'internal_admin',
        authorName: actorName,
        message: note,
        timelineEvent: 'internal_note',
        traceId: normalizeText(body.traceId, 120) || getOrCreateRequestId(ctx),
      })
      const now = new Date().toISOString()
      await strapi.entityService.update('api::inquiry-submission.inquiry-submission', id, {
        data: {
          internalNoteState: 'updated',
          lastActionAt: now,
        } as Record<string, unknown>,
      })
      ctx.body = { data: { accepted: true, internalNoteState: 'updated', notedAt: now } }
    },
  }),
)
