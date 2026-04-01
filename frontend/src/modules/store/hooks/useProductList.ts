import { useEffect } from 'react'
import { useAsyncState } from '@/hooks'
import { getProducts } from '@/modules/store/api'
import type { ShopifyProductSummary } from '@/lib/shopify/types'

export function useProductList(first = 12) {
  const { data, loading, error, execute } = useAsyncState<ShopifyProductSummary[]>()

  useEffect(() => {
    void execute(() => getProducts(first))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    products: data ?? [],
    loading,
    error,
  }
}
