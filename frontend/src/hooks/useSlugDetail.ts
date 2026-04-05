import { useState, useEffect } from 'react'
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
}

/**
 * スラッグで単一コンテンツを取得する汎用フック
 *
 * @param fetcher - (slug) => Promise<T | null> の形式の API 関数
 * @param slug    - URL パラメータから取得したスラッグ
 *
 * @example
 * const { item, loading, error, notFound } = useSlugDetail(getNewsDetail, slug)
 */
export function useSlugDetail<T>(
  fetcher: (slug: string) => Promise<T | null>,
  slug: string | undefined,
): UseSlugDetailResult<T> {
  const { data, loading, error, execute } = useAsyncState<T | null>()
  const [fetched, setFetched] = useState(false)
  const hasSlug = Boolean(slug)
  const isSlugValid = hasSlug && SAFE_SLUG_PATTERN.test(slug ?? '')

  useEffect(() => {
    setFetched(false)
    if (!slug || !isSlugValid) {
      setFetched(true)
      return
    }
    void execute(() => fetcher(slug)).then(() => setFetched(true))
    // fetcher は呼び出し元で安定した参照を渡すことを前提とする
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isSlugValid])

  return {
    item: data ?? null,
    // 初回フェッチ前もローディング扱いにすることで not found の誤表示を防ぐ
    loading: !fetched || (isSlugValid && loading),
    error,
    notFound: fetched && (!isSlugValid || (!loading && !error && data === null)),
  }
}
