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

const ALLOWED_TYPES = [
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

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return 'fileTooLarge'
  if (!ALLOWED_TYPES.includes(file.type)) return 'fileType'
  return null
}

function getStrapiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL as string | undefined
  if (!baseUrl) throw new Error('VITE_STRAPI_API_URL is not set')
  return baseUrl.replace(/\/$/, '')
}

function getSourceSite(): 'main' | 'store' | 'fc' | 'unknown' {
  const siteType = String(import.meta.env.VITE_SITE_TYPE ?? '').toLowerCase()
  if (siteType === 'main' || siteType === 'store' || siteType === 'fc') return siteType
  return 'unknown'
}

async function submitInquiry(formData: FormData): Promise<{ id: number; status: string; submittedAt: string }> {
  const res = await fetch(`${getStrapiBaseUrl()}/api/inquiry-submissions/public`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const json = await res.json() as { error?: { message?: string }; message?: string }
      message = json.error?.message ?? json.message ?? message
    } catch {
      // noop
    }
    throw new Error(message)
  }

  const json = await res.json() as { data: { id: number; status: string; submittedAt: string } }
  return json.data
}

function appendCommon(fd: FormData, values: Record<string, string | boolean | number | undefined>, files?: File[]) {
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    fd.append(key, String(value))
  })

  ;(files ?? []).slice(0, MAX_FILES).forEach((file) => {
    fd.append('attachments', file, file.name)
  })
}

export async function submitContact(payload: ContactPayload & { locale: string; sourcePage: string }) {
  const fd = new FormData()
  appendCommon(fd, {
    formType: 'contact',
    inquiryCategory: 'general',
    name: payload.name,
    email: payload.email,
    subject: payload.subject,
    message: payload.message,
    phone: payload.phone ?? '',
    policyAgree: payload.policyAgree,
    locale: payload.locale,
    sourcePage: payload.sourcePage,
    sourceSite: getSourceSite(),
    website: payload.honeypot ?? '',
  }, payload.files)

  return submitInquiry(fd)
}

export async function submitRequest(payload: RequestPayload & { locale: string; sourcePage: string }) {
  const fd = new FormData()
  appendCommon(fd, {
    formType: 'request',
    inquiryCategory: payload.requestType || 'other',
    name: payload.name,
    companyOrOrganization: payload.company,
    email: payload.email,
    message: payload.detail,
    phone: payload.phone ?? '',
    policyAgree: payload.policyAgree,
    locale: payload.locale,
    sourcePage: payload.sourcePage,
    sourceSite: getSourceSite(),
    website: payload.honeypot ?? '',
    requestType: payload.requestType,
    budget: payload.budget,
    deadline: payload.deadline,
  }, payload.files)

  return submitInquiry(fd)
}

export async function submitRestock(payload: RestockPayload & { sourcePage: string }) {
  const fd = new FormData()
  appendCommon(fd, {
    formType: 'restock',
    inquiryCategory: 'restock',
    email: payload.email,
    locale: payload.locale,
    sourcePage: payload.sourcePage,
    sourceSite: getSourceSite(),
    policyAgree: true,
    productId: payload.productId,
    productSlug: payload.productSlug,
    productTitle: payload.productTitle,
  })
  return submitInquiry(fd)
}

export { MAX_FILES }
