import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isPreviewMode, clearPreview } from '@/lib/preview'

/**
 * プレビューモード中に画面上部に表示するフローティングバー
 *
 * - プレビューモード中のみ表示
 * - 「プレビュー終了」ボタンでフラグを削除しホームへ
 */
export default function PreviewBanner() {
  const [active, setActive] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setActive(isPreviewMode())
  }, [])

  if (!active) return null

  function handleExit() {
    clearPreview()
    setActive(false)
    navigate('/', { replace: true })
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 bg-violet-600 px-4 py-2 text-white">
      <span className="font-mono text-xs tracking-wide">
        <span className="mr-2 inline-block rounded-sm bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
          PREVIEW
        </span>
        下書きコンテンツを表示中
      </span>
      <button
        onClick={handleExit}
        className="shrink-0 rounded border border-white/30 px-3 py-1 font-mono text-[11px] text-white/90 transition-colors hover:bg-white/10"
      >
        プレビュー終了
      </button>
    </div>
  )
}
