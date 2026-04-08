import { useState, useCallback } from 'react'
import type { AsyncState } from '@/types'
import { StrapiApiError } from '@/lib/api/client'

/**
 * 非同期処理の loading / error / data を管理する汎用フック
 */
export function useAsyncState<T>(initialData: T | null = null) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const data = await asyncFn()
      setState({ data, loading: false, error: null })
      return data
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[useAsyncState] request failed', err)
      }

      const isProd = import.meta.env.PROD
      const rawMessage = err instanceof Error ? err.message : 'Unknown error'
      const hasUnexpectedTokenHtml = /unexpected token\s*</i.test(rawMessage)
      const error = isProd
        ? 'データの取得に失敗しました。時間をおいて再試行してください。'
        : hasUnexpectedTokenHtml
          ? 'API レスポンスの形式が不正です。設定またはサーバー状態を確認してください。'
          : rawMessage

      // 開発時の診断情報（本番ユーザー向け UI には出さない）
      if (import.meta.env.DEV && err instanceof StrapiApiError && err.details) {
        console.error('[Strapi diagnostics]', {
          status: err.status,
          statusText: err.statusText,
          retried: err.details.retried,
          url: err.details.url,
          contentType: err.details.contentType,
          responseSnippet: err.details.responseSnippet,
          requestId: err.details.requestId,
        })
      }

      setState((prev) => ({ ...prev, loading: false, error }))
      return null
    }
  }, [])

  return { ...state, execute }
}
