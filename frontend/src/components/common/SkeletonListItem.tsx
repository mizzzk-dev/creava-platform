/**
 * リスト系ページ（Blog / News / Works / Fanclub）のローディングスケルトン
 * タイトル行 + 日付行のシェイプに合わせた pulse アニメーション
 */
export default function SkeletonListItem() {
  return (
    <li className="animate-pulse py-4">
      <div className="h-4 w-3/4 rounded bg-gray-100" />
      <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
    </li>
  )
}
