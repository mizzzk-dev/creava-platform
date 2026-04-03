export interface ContactPayload {
  name: string
  email: string
  subject: string
  message: string
}

export interface RequestPayload {
  name: string
  email: string
  company: string
  requestType: string
  budget: string
  deadline: string
  detail: string
}

const CONTACT_FORM_ID = import.meta.env.VITE_FORMSPREE_CONTACT_ID as string | undefined
const REQUEST_FORM_ID = import.meta.env.VITE_FORMSPREE_REQUEST_ID as string | undefined

async function postToFormspree(formId: string, data: Record<string, string>): Promise<void> {
  const res = await fetch(`https://formspree.io/f/${formId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = (body as { error?: string }).error ?? `HTTP ${res.status}`
    throw new Error(message)
  }
}

/**
 * 問い合わせフォームの送信処理（Formspree）
 *
 * VITE_FORMSPREE_CONTACT_ID が未設定の場合はスタブ動作（開発用）。
 */
export async function submitContact(payload: ContactPayload): Promise<void> {
  if (!CONTACT_FORM_ID) {
    if (import.meta.env.DEV) {
      console.warn('[contact] VITE_FORMSPREE_CONTACT_ID is not set. Using dev stub (no email sent).')
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 800))
    return
  }

  await postToFormspree(CONTACT_FORM_ID, {
    name: payload.name,
    email: payload.email,
    subject: payload.subject,
    message: payload.message,
  })
}

/**
 * 仕事依頼フォームの送信処理（Formspree）
 *
 * VITE_FORMSPREE_REQUEST_ID が未設定の場合はスタブ動作（開発用）。
 */
export async function submitRequest(payload: RequestPayload): Promise<void> {
  if (!REQUEST_FORM_ID) {
    if (import.meta.env.DEV) {
      console.warn('[contact] VITE_FORMSPREE_REQUEST_ID is not set. Using dev stub (no email sent).')
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 800))
    return
  }

  await postToFormspree(REQUEST_FORM_ID, {
    name: payload.name,
    email: payload.email,
    company: payload.company,
    requestType: payload.requestType,
    budget: payload.budget,
    deadline: payload.deadline,
    detail: payload.detail,
  })
}
