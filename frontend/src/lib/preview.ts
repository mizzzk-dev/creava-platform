/**
 * CMS プレビューモード管理
 *
 * フロー:
 * 1. CMS 管理画面の preview ボタン → /preview?secret=XXX&type=news-item&slug=my-slug
 * 2. PreviewPage がシークレットを検証し sessionStorage にフラグをセット
 * 3. 詳細ページへリダイレクト
 * 4. API クライアントが sessionStorage を確認し、有効な場合 status=draft を付与
 * 5. "プレビュー終了" ボタンでフラグを削除
 */

const STORAGE_KEY = 'cms_preview_state'
const SECRET = (import.meta.env.VITE_PREVIEW_SECRET as string | undefined) ?? ''
const STRAPI_VERIFY_ENDPOINT = (import.meta.env.VITE_PREVIEW_VERIFY_ENDPOINT as string | undefined) ?? ''
const WORDPRESS_VERIFY_ENDPOINT = (import.meta.env.VITE_WORDPRESS_PREVIEW_VERIFY_ENDPOINT as string | undefined) ?? ''

type PreviewProvider = 'strapi' | 'wordpress'

interface PreviewVerificationInput {
  secret: string
  type: string
  slug: string
  locale: string | null
  provider?: PreviewProvider
}

interface PreviewSessionState {
  provider: PreviewProvider
  activatedAt: string
}

function resolvePreviewProvider(provider?: PreviewProvider): PreviewProvider {
  if (provider) return provider
  return import.meta.env.VITE_CMS_PROVIDER === 'wordpress' ? 'wordpress' : 'strapi'
}

function getVerifyEndpoint(provider: PreviewProvider): string {
  return provider === 'wordpress' ? WORDPRESS_VERIFY_ENDPOINT : STRAPI_VERIFY_ENDPOINT
}

function savePreviewState(state: PreviewSessionState): boolean {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

function readPreviewState(): PreviewSessionState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PreviewSessionState
    if (parsed.provider !== 'strapi' && parsed.provider !== 'wordpress') return null
    if (!parsed.activatedAt) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * 現在プレビューモードかどうかを返す
 */
export function isPreviewMode(): boolean {
  return readPreviewState() !== null
}

export function getPreviewProvider(): PreviewProvider | null {
  return readPreviewState()?.provider ?? null
}

async function verifyByBackend(input: PreviewVerificationInput, provider: PreviewProvider): Promise<boolean> {
  const endpoint = getVerifyEndpoint(provider)
  if (!endpoint) return false

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        ...input,
        provider,
      }),
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
  const provider = resolvePreviewProvider(input.provider)
  const verifiedByBackend = await verifyByBackend(input, provider)
  const verified = verifiedByBackend || verifyByFallbackSecret(input.secret)
  if (!verified) return false

  return savePreviewState({
    provider,
    activatedAt: new Date().toISOString(),
  })
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
