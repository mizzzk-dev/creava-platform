import { useState, useEffect } from 'react'
import { useAsyncState } from '@/hooks'
import { getProduct } from '@/modules/store/api'
import type { ShopifyProduct } from '@/lib/shopify/types'

export function useProductDetail(handle: string | undefined) {
  const { data, loading, error, execute } = useAsyncState<ShopifyProduct | null>()
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!handle) return
    void execute(() => getProduct(handle)).then(() => setFetched(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle])

  return {
    product: data ?? null,
    loading: !fetched || loading,
    error,
    notFound: fetched && !loading && !error && data === null,
  }
}
