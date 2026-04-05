export interface CartItem {
  id: number
  slug: string
  title: string
  price: number
  currency: string
  quantity: number
  accessStatus: 'public' | 'fc_only' | 'limited'
  purchaseStatus: 'available' | 'soldout' | 'coming_soon'
  thumbnailUrl?: string | null
  stripeLink?: string | null
}

export interface CartState {
  items: CartItem[]
}
