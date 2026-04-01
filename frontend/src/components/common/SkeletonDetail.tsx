/**
 * 詳細ページ（Blog / News / Works / Fanclub）のローディングスケルトン
 * タイトル・日付・本文エリアのシェイプに合わせた pulse アニメーション
 */
export default function SkeletonDetail() {
  return (
    <div className="animate-pulse max-w-3xl">
      {/* タイトル */}
      <div className="h-8 w-2/3 rounded bg-gray-100" />
      {/* 日付 */}
      <div className="mt-3 h-3 w-28 rounded bg-gray-100" />
      {/* 本文 */}
      <div className="mt-8 space-y-3">
        <div className="h-4 rounded bg-gray-100" />
        <div className="h-4 w-11/12 rounded bg-gray-100" />
        <div className="h-4 w-4/5 rounded bg-gray-100" />
        <div className="h-4 rounded bg-gray-100" />
        <div className="h-4 w-9/12 rounded bg-gray-100" />
        <div className="h-4 w-10/12 rounded bg-gray-100" />
        <div className="h-4 rounded bg-gray-100" />
        <div className="h-4 w-3/5 rounded bg-gray-100" />
      </div>
    </div>
  )
}
