export type * from './user'
export type * from './content'

/**
 * ページコンポーネントの共通 Props
 */
export interface PageProps {
  title?: string
}

/**
 * API のローディング・エラー状態
 */
export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * 多言語対応のロケール
 */
export type Locale = 'ja' | 'en'
