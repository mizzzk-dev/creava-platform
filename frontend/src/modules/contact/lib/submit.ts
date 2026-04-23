export interface ContactPayload {
  name: string
  email: string
  subject: string
  message: string
  phone?: string
  policyAgree: boolean
  honeypot?: string
  files?: File[]
}

export interface RequestPayload {
  name: string
  email: string
  company: string
  requestType: string
  budget: string
  deadline: string
  detail: string
  phone?: string
  policyAgree: boolean
  honeypot?: string
  files?: File[]
}

export interface RestockPayload {
  email: string
  productId: number
  productSlug: string
  productTitle: string
  locale: string
}

export type InquirySubmitState = 'idle' | 'validating' | 'ready_to_confirm' | 'confirmed' | 'submitting' | 'succeeded' | 'failed'
export type InquiryDeliveryState = 'not_sent' | 'queued' | 'delivered' | 'failed' | 'unknown'
export type InquiryResultState = 'none' | 'success' | 'validation_error' | 'delivery_error' | 'system_error'
export type InquiryRequesterType = 'guest' | 'authenticated_user' | 'member'

export interface InquirySubmissionResult {
  id: number
  status: string
  submittedAt: string
  requestId?: string
  inquiryTraceId?: string
  inquirySubmitState: InquirySubmitState
  inquiryDeliveryState: InquiryDeliveryState
  inquiryResultState: InquiryResultState
  inquiryRequesterType: InquiryRequesterType
  inquiryReceivedAt: string
  inquiryConfirmedAt: string
  inquirySentAt: string
  inquiryFailedAt: string | null
  inquiryNotificationState: 'not_configured' | 'sent' | 'failed' | 'unknown'
  inquiryStorageState: 'stored' | 'failed'
  inquiryAdminReviewState: 'new' | 'spam' | 'unknown'
}

export class InquirySubmitError extends Error {
  constructor(
    message: string,
    public readonly resultState: Exclude<InquiryResultState, 'none' | 'success'>,
    public readonly requestId?: string,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'InquirySubmitError'
  }
}

export interface GenericFormSubmitPayload {
  formType: string
  inquiryCategory?: string
  locale: string
  sourcePage: string
  honeypot?: string
  policyAgree?: boolean
  fields: Record<string, string | boolean | number | undefined>
  files?: File[]
}

const DEFAULT_ALLOWED_TYPES = [
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
]

const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_FILES = 5

export function validateFile(file: File, allowedTypes = DEFAULT_ALLOWED_TYPES, maxFileBytes = MAX_FILE_BYTES): string | null {
  if (file.size > maxFileBytes) return 'fileTooLarge'
  if (!allowedTypes.includes(file.type)) return 'fileType'
  return null
}

function getStrapiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL as string | undefined
  if (!baseUrl) {
    throw new InquirySubmitError('VITE_STRAPI_API_URL が未設定のため送信できません。運用設定を確認してください。', 'system_error')
  }
  return baseUrl.replace(/\/$/, '')
}

export function getSourceSite(): 'main' | 'store' | 'fc' | 'unknown' {
  const siteType = String(import.meta.env.VITE_SITE_TYPE ?? '').toLowerCase()
  if (siteType === 'main' || siteType === 'store' || siteType === 'fc') return siteType
  return 'unknown'
}

function getDefaultInquiryCategory(formType: string, requestType?: string): string {
  const site = getSourceSite()

  if (formType === 'restock') return 'restock'
  if (formType === 'request') {
    if (requestType) return requestType
    if (site === 'store') return 'order'
    if (site === 'fc') return 'membership'
    return 'project_request'
  }

  if (formType === 'store_support') return 'order'
  if (formType === 'fc_support') return 'membership'
  if (formType === 'collaboration') return 'collaboration'
  if (formType === 'event') return 'event'
  if (site === 'store') return 'product'
  if (site === 'fc') return 'member_support'
  return 'general'
}

function classifyError(statusCode: number | undefined, message: string): Exclude<InquiryResultState, 'none' | 'success'> {
  if (statusCode === 400) return 'validation_error'
  if (statusCode === 429) return 'delivery_error'
  if (/policy|required|不正|不足|validation/i.test(message)) return 'validation_error'
  if (/timeout|network|html|cors|delivery|retry|429/i.test(message)) return 'delivery_error'
  return 'system_error'
}

async function submitInquiry(formData: FormData): Promise<InquirySubmissionResult> {
  const res = await fetch(`${getStrapiBaseUrl()}/api/inquiry-submissions/public`, {
    method: 'POST',
    body: formData,
  })

  const requestId = res.headers.get('x-request-id') ?? undefined
  const contentType = res.headers.get('content-type') ?? ''

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    if (contentType.includes('application/json')) {
      try {
        const json = await res.json() as { error?: { message?: string }; message?: string }
        message = json.error?.message ?? json.message ?? message
      } catch {
        // noop
      }
    } else {
      const text = await res.text().catch(() => '')
      if (/<!doctype html>|<html/i.test(text)) {
        message = 'フォーム送信APIがHTMLを返しました。サーバー障害またはURL設定を確認してください。'
      }
    }

    if (requestId) {
      message = `${message} (requestId: ${requestId})`
    }

    throw new InquirySubmitError(message, classifyError(res.status, message), requestId, res.status)
  }

  if (!contentType.includes('application/json')) {
    throw new InquirySubmitError('フォーム送信APIのレスポンス形式が不正です。', 'system_error', requestId, res.status)
  }

  const json = await res.json() as { data: InquirySubmissionResult }
  return {
    ...json.data,
    inquirySubmitState: json.data.inquirySubmitState ?? 'succeeded',
    inquiryDeliveryState: json.data.inquiryDeliveryState ?? 'unknown',
    inquiryResultState: json.data.inquiryResultState ?? 'success',
    inquiryRequesterType: json.data.inquiryRequesterType ?? 'guest',
    inquiryReceivedAt: json.data.inquiryReceivedAt ?? json.data.submittedAt,
    inquiryConfirmedAt: json.data.inquiryConfirmedAt ?? json.data.submittedAt,
    inquirySentAt: json.data.inquirySentAt ?? json.data.submittedAt,
    inquiryFailedAt: json.data.inquiryFailedAt ?? null,
    inquiryNotificationState: json.data.inquiryNotificationState ?? 'unknown',
    inquiryStorageState: json.data.inquiryStorageState ?? 'stored',
    inquiryAdminReviewState: json.data.inquiryAdminReviewState ?? 'unknown',
  }
}

function appendCommon(fd: FormData, values: Record<string, string | boolean | number | undefined>, files?: File[], maxFiles = MAX_FILES) {
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    fd.append(key, String(value))
  })

  ;(files ?? []).slice(0, maxFiles).forEach((file) => {
    fd.append('attachments', file, file.name)
  })
}

export async function submitGenericForm(payload: GenericFormSubmitPayload & { maxFiles?: number }) {
  const fd = new FormData()
  appendCommon(fd, {
    formType: payload.formType,
    inquiryCategory: payload.inquiryCategory ?? getDefaultInquiryCategory(payload.formType, String(payload.fields.requestType ?? '')),
    locale: payload.locale,
    sourcePage: payload.sourcePage,
    sourceSite: getSourceSite(),
    website: payload.honeypot ?? '',
    policyAgree: payload.policyAgree ?? false,
    ...payload.fields,
  }, payload.files, payload.maxFiles)

  return submitInquiry(fd)
}

export async function submitContact(payload: ContactPayload & { locale: string; sourcePage: string }) {
  return submitGenericForm({
    formType: 'contact',
    locale: payload.locale,
    sourcePage: payload.sourcePage,
    honeypot: payload.honeypot,
    policyAgree: payload.policyAgree,
    files: payload.files,
    fields: {
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      message: payload.message,
      phone: payload.phone ?? '',
    },
  })
}

export async function submitRequest(payload: RequestPayload & { locale: string; sourcePage: string }) {
  return submitGenericForm({
    formType: 'request',
    locale: payload.locale,
    sourcePage: payload.sourcePage,
    honeypot: payload.honeypot,
    policyAgree: payload.policyAgree,
    files: payload.files,
    fields: {
      name: payload.name,
      companyOrOrganization: payload.company,
      email: payload.email,
      message: payload.detail,
      phone: payload.phone ?? '',
      requestType: payload.requestType,
      budget: payload.budget,
      deadline: payload.deadline,
    },
  })
}

export async function submitRestock(payload: RestockPayload & { sourcePage: string }) {
  return submitGenericForm({
    formType: 'restock',
    locale: payload.locale,
    sourcePage: payload.sourcePage,
    policyAgree: true,
    fields: {
      email: payload.email,
      productId: payload.productId,
      productSlug: payload.productSlug,
      productTitle: payload.productTitle,
    },
  })
}

export { MAX_FILES, MAX_FILE_BYTES, DEFAULT_ALLOWED_TYPES }
