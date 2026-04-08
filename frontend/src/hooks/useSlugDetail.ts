import { useState, useEffect, useRef, useCallback } from 'react'
import { useAsyncState } from './useAsyncState'

const SAFE_SLUG_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]{0,79})$/

export interface UseSlugDetailResult<T> {
  /** 取得したアイテム。loading中 / not found は null */
  item: T | null
  /** API ロード中（初回フェッチ前も含む） */
  loading: boolean
  /** API エラーメッセージ */
  error: string | null
  /** フェッチ完了後、データが存在しない場合 true */
  notFound: boolean
  /** 再取得 */
  refetch: () => Promise<T | null>
}

/**
 * スラッグで単一コンテンツを取得する汎用フック
 */
export function useSlugDetail<T>(
  fetcher: (slug: string, signal?: AbortSignal) => Promise<T | null>,
  slug: string | undefined,
): UseSlugDetailResult<T> {
  const { data, loading, error, execute } = useAsyncState<T | null>()
  const [fetched, setFetched] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const hasSlug = Boolean(slug)
  const isSlugValid = hasSlug && SAFE_SLUG_PATTERN.test(slug ?? '')

  const runFetch = useCallback(async () => {
    setFetched(false)
    if (!slug || !isSlugValid) {
      setFetched(true)
      return null
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const result = await execute(() => fetcher(slug, controller.signal))
    setFetched(true)
    return result
  }, [execute, fetcher, isSlugValid, slug])

  useEffect(() => {
    void runFetch()
    return () => {
      abortRef.current?.abort()
    }
  }, [runFetch])

  return {
    item: data ?? null,
    // 初回フェッチ前もローディング扱いにすることで not found の誤表示を防ぐ
    loading: !fetched || (isSlugValid && loading),
    error,
    notFound: fetched && (!isSlugValid || (!loading && !error && data === null)),
    refetch: runFetch,
  }
}
