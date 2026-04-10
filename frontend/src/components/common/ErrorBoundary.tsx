import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import InternalErrorPage from '@/pages/InternalErrorPage'

interface Props {
  children: ReactNode
  /** カスタムフォールバック UI。省略時はデフォルト表示 */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * 子コンポーネントの予期しないエラーをキャッチして白画面を防ぐ
 *
 * React の Error Boundary は class component でのみ実装可能。
 * アプリ全体または特定セクションを囲んで使用する。
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 本番では外部ロギングサービス（Sentry 等）に送信するここに追加する
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <InternalErrorPage
          code="500"
          onRetry={() => {
            this.setState({ hasError: false, error: null })
          }}
        />
      )
    }

    return this.props.children
  }
}
