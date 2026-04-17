export interface ContactPayload {
  inquiryCategory: string
  name: string
  companyOrOrganization: string
  email: string
  phone: string
  subject: string
  message: string
  policyAgree: boolean
  honeypot?: string
  files?: File[]
}

export interface RequestPayload {
  inquiryCategory: string
  name: string
  company: string
  email: string
  phone: string
  subject: string
  requestType: string
  budget: string
  deadline: string
  detail: string
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

export class FormSubmissionError extends Error {
  constructor(
    message: string,
    public readonly kind: 'validation' | 'temporary' | 'network',
  ) {
    super(message)
    this.name = 'FormSubmissionError'
  }
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'image/jpeg',
  'image/png',
  'image/webp',
]

const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_FILES = 3
const MAX_TOTAL_FILE_BYTES = 20 * 1024 * 1024

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return 'fileTooLarge'
  if (!ALLOWED_TYPES.includes(file.type)) return 'fileType'
  return null
}

export function validateFiles(files: File[]): string | null {
  if (files.length > MAX_FILES) return 'fileCount'
  const total = files.reduce((sum, file) => sum + file.size, 0)
  if (total > MAX_TOTAL_FILE_BYTES) return 'fileTotalTooLarge'
  return null
}

function getStrapiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL as string | undefined
  if (!baseUrl) throw new Error('VITE_STRAPI_API_URL is not set')
  return baseUrl.replace(/\/$/, '')
}

function getSourceSite(): 'main' | 'store' | 'fc' | 'unknown' {
  const siteType = String(import.meta.env.VITE_SITE_TYPE ?? '').toLowerCase()
  if (siteType === 'fanclub') return 'fc'
  if (siteType === 'main' || siteType === 'store' || siteType === 'fc') return siteType
  return 'unknown'
}

type SubmitResult = { id: number; status: string; submittedAt: string }

async function parseApiError(res: Response): Promise<FormSubmissionError> {
  let message = `HTTP ${res.status}`
  try {
    const json = await res.json() as { error?: { message?: string }; message?: string }
    message = json.error?.message ?? json.message ?? message
  } catch {
    // noop
  }
  if (res.status >= 400 && res.status < 500) return new FormSubmissionError(message, 'validation')
  if (res.status >= 500) return new FormSubmissionError(message, 'temporary')
  return new FormSubmissionError(message, 'network')
}

async function uploadFiles(files: File[]): Promise<number[]> {
  if (files.length === 0) return []
  const fd = new FormData()
  files.forEach((file) => fd.append('attachments', file, file.name))

  const res = await fetch(`${getStrapiBaseUrl()}/api/forms/upload`, { method: 'POST', body: fd })
  if (!res.ok) throw await parseApiError(res)

  const json = await res.json() as { data: { id: number }[] }
  return json.data.map((item) => item.id)
}

async function confirmSubmission(payload: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${getStrapiBaseUrl()}/api/forms/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw await parseApiError(res)
}

async function submitSubmission(payload: Record<string, unknown>): Promise<SubmitResult> {
  const res = await fetch(`${getStrapiBaseUrl()}/api/forms/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw await parseApiError(res)

  const json = await res.json() as { data: SubmitResult }
  return json.data
}

export async function confirmContact(payload: ContactPayload & { locale: string; sourcePage: string }): Promise<void> {
  await confirmSubmission({
    formType: 'contact',
    inquiryCategory: payload.inquiryCategory,
    name: payload.name,
    companyOrOrganization: payload.companyOrOrganization,
    email: payload.email,
    phone: payload.phone,
    subject: payload.subject,
    message: payload.message,
    policyAgree: payload.policyAgree,
    locale: payload.locale,
    sourceSite: getSourceSite(),
    sourcePage: payload.sourcePage,
    website: payload.honeypot ?? '',
  })
}

export async function submitContact(payload: ContactPayload & { locale: string; sourcePage: string }): Promise<SubmitResult> {
  const files = payload.files ?? []
  const fileErr = validateFiles(files)
  if (fileErr) throw new FormSubmissionError(fileErr, 'validation')

  const attachmentIds = await uploadFiles(files)
  return submitSubmission({
    formType: 'contact',
    inquiryCategory: payload.inquiryCategory,
    name: payload.name,
    companyOrOrganization: payload.companyOrOrganization,
    email: payload.email,
    phone: payload.phone,
    subject: payload.subject,
    message: payload.message,
    policyAgree: payload.policyAgree,
    locale: payload.locale,
    sourceSite: getSourceSite(),
    sourcePage: payload.sourcePage,
    website: payload.honeypot ?? '',
    attachmentIds,
  })
}

export async function confirmRequest(payload: RequestPayload & { locale: string; sourcePage: string }): Promise<void> {
  await confirmSubmission({
    formType: 'request',
    inquiryCategory: payload.inquiryCategory || payload.requestType,
    name: payload.name,
    companyOrOrganization: payload.company,
    email: payload.email,
    phone: payload.phone,
    subject: payload.subject,
    message: payload.detail,
    requestType: payload.requestType,
    budget: payload.budget,
    deadline: payload.deadline,
    policyAgree: payload.policyAgree,
    locale: payload.locale,
    sourceSite: getSourceSite(),
    sourcePage: payload.sourcePage,
    website: payload.honeypot ?? '',
  })
}

export async function submitRequest(payload: RequestPayload & { locale: string; sourcePage: string }): Promise<SubmitResult> {
  const files = payload.files ?? []
  const fileErr = validateFiles(files)
  if (fileErr) throw new FormSubmissionError(fileErr, 'validation')

  const attachmentIds = await uploadFiles(files)
  return submitSubmission({
    formType: 'request',
    inquiryCategory: payload.inquiryCategory || payload.requestType,
    name: payload.name,
    companyOrOrganization: payload.company,
    email: payload.email,
    phone: payload.phone,
    subject: payload.subject,
    message: payload.detail,
    requestType: payload.requestType,
    budget: payload.budget,
    deadline: payload.deadline,
    policyAgree: payload.policyAgree,
    locale: payload.locale,
    sourceSite: getSourceSite(),
    sourcePage: payload.sourcePage,
    website: payload.honeypot ?? '',
    attachmentIds,
  })
}

export async function submitRestock(payload: RestockPayload & { sourcePage: string }): Promise<SubmitResult> {
  return submitSubmission({
    formType: 'restock',
    inquiryCategory: 'restock',
    name: payload.email,
    email: payload.email,
    subject: `[Restock] ${payload.productTitle}`,
    message: `productId=${payload.productId},slug=${payload.productSlug}`,
    locale: payload.locale,
    sourceSite: getSourceSite(),
    sourcePage: payload.sourcePage,
    policyAgree: true,
    attachmentIds: [],
    productId: payload.productId,
    productSlug: payload.productSlug,
    productTitle: payload.productTitle,
  })
}

export { MAX_FILE_BYTES, MAX_FILES, MAX_TOTAL_FILE_BYTES }
