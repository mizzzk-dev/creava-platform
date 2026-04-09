import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { activatePreview } from '@/lib/preview'
import { detailPath } from '@/lib/routeConstants'

/**
 * Strapi プレビューエントリーページ
 *
 * Strapi 管理画面の preview ボタンから遷移してくる
 * URL: /preview?secret=XXX&type=news-item&slug=my-slug
 *
 * 処理フロー:
 * 1. secret を検証
 * 2. 有効なら sessionStorage にプレビューフラグをセット
 * 3. コンテンツタイプに応じた詳細ページへリダイレクト
 * 4. 無効なら "/" へリダイレクト
 */
export default function PreviewPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState(false)

  useEffect(() => {
    const secret = params.get('secret') ?? ''
    const type = params.get('type') ?? ''
    const slug = params.get('slug') ?? ''

    if (!activatePreview(secret)) {
      setError(true)
      // 2 秒後にホームへ
      const t = setTimeout(() => navigate('/', { replace: true }), 2000)
      return () => clearTimeout(t)
    }

    const path = resolveDetailPath(type, slug)
    navigate(path, { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2">
        <p className="font-mono text-sm text-red-400">Invalid preview secret.</p>
        <p className="font-mono text-xs text-gray-400">Redirecting to home…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="font-mono text-xs text-gray-400">Loading preview…</p>
    </div>
  )
}

function resolveDetailPath(type: string, slug: string): string {
  if (!slug) return '/'
  switch (type) {
    case 'news-item':       return detailPath.news(slug)
    case 'blog-post':       return detailPath.blog(slug)
    case 'work':            return detailPath.work(slug)
    case 'event':           return detailPath.event(slug)
    case 'fanclub-content': return detailPath.fanclub(slug)
    case 'store-product':   return detailPath.product(slug)
    default:                return '/'
  }
}
