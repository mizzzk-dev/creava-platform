/**
 * 商品詳細ページのローディングスケルトン
 * 2カラム（画像 / 情報）レイアウトのシェイプに合わせた pulse アニメーション
 */
export default function SkeletonProductDetail() {
  return (
    <div className="animate-pulse grid grid-cols-1 gap-12 md:grid-cols-2">
      {/* 画像 */}
      <div className="aspect-square w-full rounded bg-gray-100" />

      {/* 情報 */}
      <div className="flex flex-col">
        {/* タイトル */}
        <div className="h-7 w-3/4 rounded bg-gray-100" />
        {/* 価格 */}
        <div className="mt-4 h-5 w-24 rounded bg-gray-100" />
        {/* 説明 */}
        <div className="mt-8 space-y-3">
          <div className="h-4 rounded bg-gray-100" />
          <div className="h-4 w-11/12 rounded bg-gray-100" />
          <div className="h-4 w-4/5 rounded bg-gray-100" />
        </div>
        {/* ボタン */}
        <div className="mt-8 h-12 w-40 rounded bg-gray-100" />
      </div>
    </div>
  )
}
