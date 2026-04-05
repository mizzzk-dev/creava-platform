import type { CartState } from './types'

const KEY = 'mizzz_cart_v1'

export function loadCart(): CartState {
  if (typeof window === 'undefined') return { items: [] }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { items: [] }
    const parsed = JSON.parse(raw) as CartState
    return { items: Array.isArray(parsed.items) ? parsed.items : [] }
  } catch {
    return { items: [] }
  }
}

export function saveCart(state: CartState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(state))
}
