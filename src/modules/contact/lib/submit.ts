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

/**
 * 問い合わせフォームの送信処理
 * TODO: Formspree / Resend / API Route / CMS などの実装に差し替える
 */
export async function submitContact(_payload: ContactPayload): Promise<void> {
  // Stub: simulate network delay
  await new Promise<void>((resolve) => setTimeout(resolve, 800))
}

/**
 * 仕事依頼フォームの送信処理
 * TODO: 実際の送信先に差し替える
 */
export async function submitRequest(_payload: RequestPayload): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 800))
}
