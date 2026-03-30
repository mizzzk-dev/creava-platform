import { useCurrentUser } from './useCurrentUser'
import { canViewContent } from '@/utils'
import type { ContentBase, UserRole } from '@/types'

/**
 * 現在のユーザーロールに基づいてコンテンツの表示可否を判定するフック
 *
 * canViewContent() を useCurrentUser と接続し、各ページが共通して使える形にまとめる。
 * 権限制御ロジックを各ページに重複させないための共通エントリーポイント。
 *
 * - isLoaded が false の間は role = 'guest' として扱う（安全側フォールバック）
 */
export function useContentAccess() {
  const { user, isLoaded } = useCurrentUser()
  const role: UserRole = user?.role ?? 'guest'

  /**
   * コンテンツリストを現在の role でフィルタリングする
   * 閲覧不可のアイテムを除外した配列を返す
   */
  function filterVisible<T extends Pick<ContentBase, 'status' | 'limitedEndAt' | 'archiveVisibleForFC'>>(
    items: T[],
  ): T[] {
    return items.filter((item) =>
      canViewContent({
        status: item.status,
        role,
        limitedEndAt: item.limitedEndAt,
        archiveVisibleForFC: item.archiveVisibleForFC,
      }),
    )
  }

  /**
   * 単一コンテンツの表示可否を判定する
   */
  function canView(
    item: Pick<ContentBase, 'status' | 'limitedEndAt' | 'archiveVisibleForFC'>,
  ): boolean {
    return canViewContent({
      status: item.status,
      role,
      limitedEndAt: item.limitedEndAt,
      archiveVisibleForFC: item.archiveVisibleForFC,
    })
  }

  return { role, isLoaded, filterVisible, canView }
}
