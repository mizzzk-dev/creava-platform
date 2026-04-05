import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loadCart, saveCart } from './storage'
import type { CartItem } from './types'
import type { StoreProduct } from '@/modules/store/types'

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (product: StoreProduct, quantity?: number) => void
  updateQuantity: (slug: string, quantity: number) => void
  removeItem: (slug: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    setItems(loadCart().items)
  }, [])

  useEffect(() => {
    saveCart({ items })
  }, [items])

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    return {
      items,
      itemCount,
      subtotal,
      addItem: (product, quantity = 1) => {
        if (product.purchaseStatus !== 'available') return

        setItems((prev) => {
          const found = prev.find((item) => item.slug === product.slug)
          if (found) {
            return prev.map((item) =>
              item.slug === product.slug
                ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
                : item,
            )
          }

          return [
            ...prev,
            {
              id: product.id,
              slug: product.slug,
              title: product.title,
              price: product.price,
              currency: product.currency,
              quantity,
              accessStatus: product.accessStatus,
              purchaseStatus: product.purchaseStatus,
              thumbnailUrl: product.previewImage?.url,
              stripeLink: product.stripeLink,
            },
          ]
        })
      },
      updateQuantity: (slug, quantity) => {
        setItems((prev) =>
          prev
            .map((item) => (item.slug === slug ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) } : item))
            .filter((item) => item.quantity > 0),
        )
      },
      removeItem: (slug) => {
        setItems((prev) => prev.filter((item) => item.slug !== slug))
      },
      clearCart: () => {
        setItems([])
      },
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used inside CartProvider')
  }
  return ctx
}
