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

/** ファイル許可 MIME タイプ */
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
 * Formspree への送信（常に multipart/form-data）
 *
 * JSON 送信は Formspree の設定・プランによって 400 になる場合があるため、
 * Content-Type をブラウザに任せる FormData を常に使用します。
 * _subject  … メール件名として Formspree が利用
 * _replyto  … 返信先として Formspree が利用
 */
async function postToFormspree(
  formId: string,
  data: Record<string, string>,
  file?: File,
): Promise<void> {
  const fd = new FormData()

  // Formspree 特殊フィールド
  if (data._subject) fd.append('_subject', data._subject)
  if (data._replyto) fd.append('_replyto', data._replyto)

  // 通常フィールド
  Object.entries(data).forEach(([k, v]) => {
    if (!k.startsWith('_')) fd.append(k, v)
  })

  // ファイル添付（Formspree Gold 以上で受信可能）
  if (file) fd.append('attachment', file, file.name)

  const res = await fetch(`https://formspree.io/f/${formId}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: fd,
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const err = await res.json() as { error?: string; errors?: { message: string }[] }
      message = err.errors?.[0]?.message ?? err.error ?? message
    } catch { /* ignore parse error */ }
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
    _subject: `[お問い合わせ] ${fields.subject}`,
    _replyto: fields.email,
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
    _subject: `[仕事依頼] ${fields.requestType} — ${fields.name}`,
    _replyto: fields.email,
    name: fields.name,
    email: fields.email,
    company: fields.company,
    requestType: fields.requestType,
    budget: fields.budget,
    deadline: fields.deadline,
    detail: fields.detail,
  }, file)
}
