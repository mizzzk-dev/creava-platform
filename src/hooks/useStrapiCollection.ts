import { useEffect } from 'react'
import { useAsyncState } from './useAsyncState'
import type { StrapiListResponse, StrapiSingleResponse } from '@/types'

/**
 * Strapi Collection Type の一覧を取得するフック
 *
 * @param fetcher - API 関数を呼び出すコールバック
 *
 * @example
 * const { items, loading, error } = useStrapiCollection(
 *   () => getNewsList({ pagination: { pageSize: 10 } })
 * )
 */
export function useStrapiCollection<T>(
  fetcher: () => Promise<StrapiListResponse<T>>,
) {
  const { data, loading, error, execute } = useAsyncState<StrapiListResponse<T>>()

  useEffect(() => {
    execute(fetcher)
    // fetcher は呼び出し元で安定した参照を渡すことを前提とする
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    /** 取得したアイテム配列。未取得時は null */
    items: data?.data ?? null,
    /** ページネーション情報 */
    pagination: data?.meta.pagination ?? null,
    loading,
    error,
    /** 再取得 */
    refetch: () => execute(fetcher),
  }
}

/**
 * Strapi Single Type を取得するフック
 *
 * @param fetcher - API 関数を呼び出すコールバック
 *
 * @example
 * const { item, loading, error } = useStrapiSingle(() => getSiteSettings())
 */
export function useStrapiSingle<T>(
  fetcher: () => Promise<StrapiSingleResponse<T>>,
) {
  const { data, loading, error, execute } = useAsyncState<StrapiSingleResponse<T>>()

  useEffect(() => {
    execute(fetcher)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    /** 取得したアイテム。未取得時は null */
    item: data?.data ?? null,
    loading,
    error,
    refetch: () => execute(fetcher),
  }
}
