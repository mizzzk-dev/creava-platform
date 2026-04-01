import { useState, useCallback } from 'react'
import type { AsyncState } from '@/types'

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
      const error = err instanceof Error ? err.message : 'Unknown error'
      setState((prev) => ({ ...prev, loading: false, error }))
      return null
    }
  }, [])

  return { ...state, execute }
}
