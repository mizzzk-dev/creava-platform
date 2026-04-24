import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { activatePreview } from '@/lib/preview'
import { detailPath } from '@/lib/routeConstants'

/**
 * Strapi プレビューエントリーページ
 *
 * Strapi 管理画面の preview ボタンから遷移してくる
 * URL: /preview?secret=XXX&type=news-item&slug=my-slug&locale=ja&theme=dark
 */
export default function PreviewPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const run = async () => {
      const secret = params.get('secret') ?? ''
      const type = params.get('type') ?? ''
      const slug = params.get('slug') ?? ''
      const locale = normalizeLocale(params.get('locale'))
      const theme = normalizeTheme(params.get('theme'))

      const verified = await activatePreview({
        secret,
        type,
        slug,
        locale,
      })

      if (!verified) {
        if (isMounted) {
          setError(true)
          timeoutId = setTimeout(() => navigate('/', { replace: true }), 2000)
        }
        return
      }

      if (locale) {
        void i18n.changeLanguage(locale)
      }

      if (theme) {
        try {
          localStorage.setItem('theme', theme)
        } catch {
          // noop
        }
      }

      const path = resolveDetailPath(type, slug)
      if (isMounted) {
        navigate(path, { replace: true })
      }
    }

    void run()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
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
    case 'campaign':        return `/campaigns/${slug}`
    case 'guide':           return `/support/guides/${slug}`
    default:                return '/'
  }
}

function normalizeLocale(raw: string | null): 'ja' | 'en' | 'ko' | null {
  if (raw === 'ja' || raw === 'en' || raw === 'ko') return raw
  return null
}

function normalizeTheme(raw: string | null): 'light' | 'dark' | null {
  if (raw === 'light' || raw === 'dark') return raw
  return null
}
