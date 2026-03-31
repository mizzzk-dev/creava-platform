/**
 * Store ページ（商品グリッド）のローディングスケルトン
 * 画像ボックス + タイトル行 + 価格行のシェイプ
 */
export default function SkeletonProductCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square w-full rounded bg-gray-100" />
      <div className="mt-3 h-4 w-3/4 rounded bg-gray-100" />
      <div className="mt-2 h-3 w-1/3 rounded bg-gray-100" />
    </div>
  )
}
