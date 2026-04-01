import { useSlugDetail } from '@/hooks'
import { getProduct } from '@/modules/store/api'
import type { StoreProduct } from '@/modules/store/types'

export function useProductDetail(slug: string | undefined) {
  const { item, loading, error, notFound } = useSlugDetail<StoreProduct>(getProduct, slug)

  return {
    product: item,
    loading,
    error,
    notFound,
  }
}
