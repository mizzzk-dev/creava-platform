import { submitRestock } from '@/modules/contact/lib/submit'

export interface RestockRequestPayload {
  email: string
  productId: number
  productSlug: string
  productTitle: string
  locale: string
}

export async function submitRestockRequest(payload: RestockRequestPayload): Promise<void> {
  await submitRestock({ ...payload, sourcePage: `/products/${payload.productSlug}` })
}
