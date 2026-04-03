export interface ContactPayload {
  name: string
  email: string
  subject: string
  message: string
  file?: File
}

export interface RequestPayload {
  name: string
  email: string
  company: string
  requestType: string
  budget: string
  deadline: string
  detail: string
  file?: File
}

const CONTACT_FORM_ID = import.meta.env.VITE_FORMSPREE_CONTACT_ID as string | undefined
const REQUEST_FORM_ID = import.meta.env.VITE_FORMSPREE_REQUEST_ID as string | undefined

/** ファイル許可拡張子 */
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return 'fileTooLarge'
  if (!ALLOWED_TYPES.includes(file.type)) return 'fileType'
  return null
}

/**
 * Formspree への送信（multipart/form-data）
 * ファイル添付はすべてのプランで利用可能。
 */
async function postToFormspree(
  formId: string,
  data: Record<string, string>,
  file?: File,
): Promise<void> {
  let body: FormData | string
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (file) {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => fd.append(k, v))
    fd.append('attachment', file, file.name)
    body = fd
    // Content-Type は FormData に任せる (boundary を自動設定)
  } else {
    body = JSON.stringify(data)
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`https://formspree.io/f/${formId}`, {
    method: 'POST',
    headers,
    body,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const message = (err as { error?: string }).error ?? `HTTP ${res.status}`
    throw new Error(message)
  }
}

/**
 * 問い合わせフォームの送信処理
 * VITE_FORMSPREE_CONTACT_ID が未設定の場合はスタブ動作（開発用）。
 */
export async function submitContact(payload: ContactPayload): Promise<void> {
  if (!CONTACT_FORM_ID) {
    if (import.meta.env.DEV) {
      console.warn('[contact] VITE_FORMSPREE_CONTACT_ID is not set. Using dev stub (no email sent).')
    }
    await new Promise<void>((r) => setTimeout(r, 800))
    return
  }

  const { file, ...fields } = payload
  await postToFormspree(CONTACT_FORM_ID, {
    name: fields.name,
    email: fields.email,
    subject: fields.subject,
    message: fields.message,
  }, file)
}

/**
 * 仕事依頼フォームの送信処理
 * VITE_FORMSPREE_REQUEST_ID が未設定の場合はスタブ動作（開発用）。
 */
export async function submitRequest(payload: RequestPayload): Promise<void> {
  if (!REQUEST_FORM_ID) {
    if (import.meta.env.DEV) {
      console.warn('[contact] VITE_FORMSPREE_REQUEST_ID is not set. Using dev stub (no email sent).')
    }
    await new Promise<void>((r) => setTimeout(r, 800))
    return
  }

  const { file, ...fields } = payload
  await postToFormspree(REQUEST_FORM_ID, {
    name: fields.name,
    email: fields.email,
    company: fields.company,
    requestType: fields.requestType,
    budget: fields.budget,
    deadline: fields.deadline,
    detail: fields.detail,
  }, file)
}
