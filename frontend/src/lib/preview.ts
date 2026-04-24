/**
 * Strapi プレビューモード管理
 *
 * フロー:
 * 1. Strapi 管理画面の preview ボタン → /preview?secret=XXX&type=news-item&slug=my-slug
 * 2. PreviewPage がシークレットを検証し sessionStorage にフラグをセット
 * 3. 詳細ページへリダイレクト
 * 4. API クライアントが sessionStorage を確認し、有効な場合 status=draft を付与
 * 5. "プレビュー終了" ボタンでフラグを削除
 */

const STORAGE_KEY = 'strapi_preview_active'
const SECRET = (import.meta.env.VITE_PREVIEW_SECRET as string | undefined) ?? ''
const VERIFY_ENDPOINT = (import.meta.env.VITE_PREVIEW_VERIFY_ENDPOINT as string | undefined) ?? ''

interface PreviewVerificationInput {
  secret: string
  type: string
  slug: string
  locale: string | null
}

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

async function verifyByBackend(input: PreviewVerificationInput): Promise<boolean> {
  if (!VERIFY_ENDPOINT) return false

  try {
    const res = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(input),
    })
    if (!res.ok) return false
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) return false
    const json = (await res.json()) as { ok?: boolean }
    return json.ok === true
  } catch {
    return false
  }
}

function verifyByFallbackSecret(secret: string): boolean {
  return Boolean(SECRET) && secret === SECRET
}

/**
 * シークレットを検証してプレビューモードを有効化する
 * @returns 有効化できたら true、シークレット不一致なら false
 */
export async function activatePreview(input: PreviewVerificationInput): Promise<boolean> {
  const verifiedByBackend = await verifyByBackend(input)
  const verified = verifiedByBackend || verifyByFallbackSecret(input.secret)
  if (!verified) return false

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
