/**
 * Strapi API エラー
 */
export class StrapiApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    message: string,
    public readonly details?: {
      url: string
      contentType: string
      responseSnippet?: string
      retried: number
      requestId?: string | null
    },
  ) {
    super(message)
    this.name = 'StrapiApiError'
  }
}

const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_STRAPI_TIMEOUT_MS ?? 15000)
const MAX_RETRIES = Number(import.meta.env.VITE_STRAPI_RETRY_COUNT ?? 2)
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])

export interface StrapiRequestOptions {
  auth?: 'none' | 'required' | 'auto'
}

/**
 * 環境変数から Strapi の接続情報を取得する
 */
function getStrapiConfig(): { baseUrl: string; token: string | undefined } {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL
  if (!baseUrl) {
    throw new Error(
      '[Strapi] VITE_STRAPI_API_URL が設定されていません。.env を確認してください。',
    )
  }
  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    token: import.meta.env.VITE_STRAPI_API_TOKEN || undefined,
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function getBackoffMs(attempt: number): number {
  return 400 * 2 ** (attempt - 1)
}

async function parseErrorResponse(
  res: Response,
  url: string,
  retried: number,
): Promise<never> {
  const contentType = res.headers.get('content-type') ?? 'unknown'
  const requestId = res.headers.get('x-request-id')

  let bodyText = ''
  try {
    bodyText = await res.text()
  } catch {
    bodyText = ''
  }

  const snippet = bodyText.slice(0, 220).trim()
  const htmlLike = /<!doctype html>|<html/i.test(snippet)

  throw new StrapiApiError(
    res.status,
    res.statusText,
    htmlLike
      ? `[Strapi] ${res.status} ${res.statusText} — HTML レスポンスを受信しました。認証切れ、プロキシエラー、または一時的なサーバー不調の可能性があります。`
      : `[Strapi] ${res.status} ${res.statusText} — ${url}`,
    {
      url,
      contentType,
      responseSnippet: snippet || undefined,
      retried,
      requestId,
    },
  )
}

async function parseJsonOrThrow<T>(
  res: Response,
  url: string,
  retried: number,
): Promise<T> {
  const contentType = res.headers.get('content-type') ?? 'unknown'
  const requestId = res.headers.get('x-request-id')

  if (!contentType.includes('application/json')) {
    const body = await res.text()
    const snippet = body.slice(0, 220).trim()
    const htmlLike = /<!doctype html>|<html/i.test(snippet)

    throw new StrapiApiError(
      res.status,
      res.statusText,
      htmlLike
        ? `[Strapi] JSON ではなく HTML を受信しました。API URL 誤設定、認証切れ、または Strapi 側の一時障害を確認してください。`
        : `[Strapi] JSON 以外のレスポンスを受信しました (content-type: ${contentType})。`,
      {
        url,
        contentType,
        responseSnippet: snippet || undefined,
        retried,
        requestId,
      },
    )
  }

  try {
    return (await res.json()) as T
  } catch {
    const body = await res.text().catch(() => '')
    throw new StrapiApiError(
      res.status,
      res.statusText,
      `[Strapi] JSON パースに失敗しました。HTML エラーページや壊れたレスポンスの可能性があります。`,
      {
        url,
        contentType,
        responseSnippet: body.slice(0, 220).trim() || undefined,
        retried,
        requestId,
      },
    )
  }
}

/**
 * Strapi API への GET リクエスト共通クライアント
 */
export async function strapiGet<T>(
  path: string,
  queryString: string = '',
  options: StrapiRequestOptions = { auth: 'auto' },
): Promise<T> {
  const { baseUrl, token } = getStrapiConfig()
  const authMode = options.auth ?? 'auto'

  const url = `${baseUrl}/api${path}${queryString}`

  const headers: Record<string, string> = { Accept: 'application/json' }

  // public GET は Authorization を送らない（不要 preflight 回避）
  if (
    authMode === 'required' ||
    (authMode === 'auto' && token && import.meta.env.VITE_STRAPI_USE_TOKEN_FOR_PUBLIC === 'true')
  ) {
    headers['Authorization'] = `Bearer ${token}`
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

    try {
      const res = await fetch(url, {
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!res.ok) {
        if (attempt < MAX_RETRIES && RETRYABLE_STATUS.has(res.status)) {
          await wait(getBackoffMs(attempt + 1))
          continue
        }
        return parseErrorResponse(res, url, attempt)
      }

      return await parseJsonOrThrow<T>(res, url, attempt)
    } catch (err) {
      clearTimeout(timeout)

      const isTimeout = err instanceof DOMException && err.name === 'AbortError'

      // タイムアウト時のみ自動再試行し、403/CORS 等の恒久エラーで待たされないようにする
      if (attempt < MAX_RETRIES && isTimeout) {
        await wait(getBackoffMs(attempt + 1))
        continue
      }

      if (err instanceof StrapiApiError) throw err

      if (isTimeout) {
        throw new StrapiApiError(
          408,
          'Request Timeout',
          `[Strapi] リクエストがタイムアウトしました (${DEFAULT_TIMEOUT_MS}ms): ${url}`,
          { url, contentType: 'unknown', retried: attempt },
        )
      }

      throw new StrapiApiError(
        0,
        'Network Error',
        `[Strapi] 通信に失敗しました。ネットワーク断、CORS、または Strapi 起動遅延の可能性があります: ${url}`,
        { url, contentType: 'unknown', retried: attempt },
      )
    }
  }

  throw new StrapiApiError(0, 'Unknown Error', '[Strapi] 不明なエラーが発生しました。')
}
