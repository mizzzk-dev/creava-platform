import { useStrapiCollection } from '@/hooks'
import { getProducts } from '@/modules/store/api'
import type { StoreProductSummary } from '@/modules/store/types'

export function useProductList(pageSize = 12) {
  const { items, loading, error, refetch } = useStrapiCollection<StoreProductSummary>(
    () => getProducts({ pagination: { pageSize } }),
  )

  return {
    products: items ?? [],
    loading,
    error,
    refetch,
  }
}
