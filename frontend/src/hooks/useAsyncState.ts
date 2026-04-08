import { useState, useCallback } from 'react'
import type { AsyncState } from '@/types'
import { StrapiApiError } from '@/lib/api/client'

function toUserSafeError(err: unknown): string {
  const isProd = import.meta.env.PROD

  if (err instanceof StrapiApiError) {
    if (isProd) {
      if (err.status === 408) return '通信が混み合っています。時間をおいて再試行してください。'
      return 'データの取得に失敗しました。時間をおいて再試行してください。'
    }

    const raw = err.message || 'Strapi API error'
    if (/html|json ではなく/i.test(raw)) {
      return 'API 応答が不正です（HTML 応答混入の可能性）。API URL / CORS / 権限を確認してください。'
    }
    return raw
  }

  const rawMessage = err instanceof Error ? err.message : 'Unknown error'
  const hasUnexpectedTokenHtml = /unexpected token\s*</i.test(rawMessage)

  if (isProd) {
    return 'データの取得に失敗しました。時間をおいて再試行してください。'
  }

  return hasUnexpectedTokenHtml
    ? 'API レスポンスの形式が不正です。設定またはサーバー状態を確認してください。'
    : rawMessage
}

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

      setState((prev) => ({ ...prev, loading: false, error: toUserSafeError(err) }))
      return null
    }
  }, [])

  return { ...state, execute }
}
