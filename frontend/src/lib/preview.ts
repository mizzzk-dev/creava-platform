/**
 * Strapi プレビューモード管理
 *
 * フロー:
 * 1. Strapi 管理画面の preview ボタン → /preview?secret=XXX&type=news-item&slug=my-slug
 * 2. PreviewPage がシークレットを検証し sessionStorage にフラグをセット
 * 3. 詳細ページへリダイレクト
 * 4. API クライアントが sessionStorage を確認し、有効な場合 status=draft を付与
 * 5. "プレビュー終了" ボタンでフラグを削除
 *
 * セキュリティ:
 * - VITE_PREVIEW_SECRET は GitHub Secrets + Strapi Cloud env に同一値を設定すること
 * - VITE_ プレフィックスのため bundle に含まれる（静的サイト前提の妥協）
 * - セッション単位でのみ有効（タブを閉じると消える）
 */

const STORAGE_KEY = 'strapi_preview_active'
const SECRET = (import.meta.env.VITE_PREVIEW_SECRET as string | undefined) ?? ''

/**
 * 現在プレビューモードかどうかを返す
 */
export function isPreviewMode(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * シークレットを検証してプレビューモードを有効化する
 * @returns 有効化できたら true、シークレット不一致なら false
 */
export function activatePreview(secret: string): boolean {
  if (!SECRET || secret !== SECRET) return false
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
    return true
  } catch {
    return false
  }
}

/**
 * プレビューモードを終了する
 */
export function clearPreview(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // noop
  }
}
