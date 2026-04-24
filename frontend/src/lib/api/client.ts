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
      traceId?: string
      endpoint?: string
      requestStartedAt?: string
      responseReceivedAt?: string
      failureAt?: string
      latencyMs?: number
      cacheState?: 'miss' | 'fresh_hit' | 'stale_hit' | 'revalidated'
    },
  ) {
    super(message)
    this.name = 'StrapiApiError'
  }
}

const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_STRAPI_TIMEOUT_MS ?? 15000)
const MAX_RETRIES = Number(import.meta.env.VITE_STRAPI_RETRY_COUNT ?? 2)
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])
const RESPONSE_CACHE_TTL_MS = Number(import.meta.env.VITE_STRAPI_RESPONSE_CACHE_TTL_MS ?? 60_000)
const RESPONSE_CACHE_STALE_TTL_MS = Number(import.meta.env.VITE_STRAPI_RESPONSE_CACHE_STALE_TTL_MS ?? 300_000)

const responseCache = new Map<string, { expiresAt: number; staleExpiresAt: number; value: unknown }>()
const inFlightRequests = new Map<string, Promise<unknown>>()
const STRAPI_DEBUG_LOG = String(import.meta.env.VITE_STRAPI_DEBUG_LOG ?? 'false').toLowerCase() === 'true'

function buildTraceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `strapi-${crypto.randomUUID()}`
  }
  return `strapi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function toIso(timestamp: number): string {
  return new Date(timestamp).toISOString()
}

function emitStrapiTelemetry(payload: Record<string, unknown>): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('strapi:request', { detail: payload }))
  }
  if (STRAPI_DEBUG_LOG && import.meta.env.DEV) {
    console.info('[Strapi telemetry]', payload)
  }
}

/**
 * 指定パスプレフィックスに一致するキャッシュエントリを削除する
 * ページ遷移後や投稿後の意図的な再フェッチに使用する
 *
 * @param pathPrefix - 削除対象のパスプレフィックス（例: '/api/news'）
 */
export function invalidateResponseCache(pathPrefix?: string): void {
  if (!pathPrefix) {
    responseCache.clear()
    return
  }
  for (const key of responseCache.keys()) {
    if (key.includes(pathPrefix)) {
      responseCache.delete(key)
    }
  }
}

export interface StrapiRequestOptions {
  auth?: 'none' | 'required' | 'auto'
  signal?: AbortSignal
  timeoutMs?: number
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
  const traceId = buildTraceId()
  const cacheKey = `${authMode}:${url}`
  const now = Date.now()
  const endpoint = `/api${path}`
  const cached = responseCache.get(cacheKey)
  if (cached) {
    if (cached.expiresAt > now) {
      emitStrapiTelemetry({
        traceId,
        endpoint,
        cacheState: 'fresh_hit',
        strapiRequestStartedAt: toIso(now),
        strapiResponseReceivedAt: toIso(now),
        strapiLatencyState: 0,
      })
      return cached.value as T
    }
    if (cached.staleExpiresAt > now) {
      void revalidateInBackground<T>(cacheKey, url, authMode, token)
      emitStrapiTelemetry({
        traceId,
        endpoint,
        cacheState: 'stale_hit',
        strapiRequestStartedAt: toIso(now),
        strapiResponseReceivedAt: toIso(now),
        strapiLatencyState: 0,
      })
      return cached.value as T
    }
  }

  const pending = inFlightRequests.get(cacheKey)
  if (pending) {
    return pending as Promise<T>
  }

  return executeRequest<T>(cacheKey, url, authMode, token, traceId, options.signal, options.timeoutMs)
}

function revalidateInBackground<T>(
  cacheKey: string,
  url: string,
  authMode: 'none' | 'required' | 'auto',
  token: string | undefined,
): void {
  if (inFlightRequests.has(cacheKey)) return
  void executeRequest<T>(cacheKey, url, authMode, token, buildTraceId()).catch(() => {
    // stale を返した直後のバックグラウンド更新失敗は握りつぶす
  })
}

async function executeRequest<T>(
  cacheKey: string,
  url: string,
  authMode: 'none' | 'required' | 'auto',
  token: string | undefined,
  traceId: string,
  externalSignal?: AbortSignal,
  timeoutMs?: number,
): Promise<T> {

  const headers: Record<string, string> = { Accept: 'application/json' }

  // public GET は Authorization を送らない（不要 preflight 回避）
  if (
    authMode === 'required' ||
    (authMode === 'auto' && token && import.meta.env.VITE_STRAPI_USE_TOKEN_FOR_PUBLIC === 'true')
  ) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const requestPromise = (async () => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const controller = new AbortController()
      const effectiveTimeout = timeoutMs ?? DEFAULT_TIMEOUT_MS
      const requestStartedAt = Date.now()
      const timeout = setTimeout(() => controller.abort(), effectiveTimeout)

      const abortRelay = () => controller.abort()
      if (externalSignal) {
        if (externalSignal.aborted) controller.abort()
        else externalSignal.addEventListener('abort', abortRelay, { once: true })
      }

      try {
        const res = await fetch(url, {
          headers,
          signal: controller.signal,
        })

        clearTimeout(timeout)
        externalSignal?.removeEventListener('abort', abortRelay)

        if (!res.ok) {
          if (attempt < MAX_RETRIES && RETRYABLE_STATUS.has(res.status)) {
            await wait(getBackoffMs(attempt + 1))
            continue
          }
          return parseErrorResponse(res, url, attempt)
        }

        const json = await parseJsonOrThrow<T>(res, url, attempt)
        const responseReceivedAt = Date.now()
        const endpoint = new URL(url).pathname
        emitStrapiTelemetry({
          traceId,
          endpoint,
          status: res.status,
          retried: attempt,
          cacheState: 'revalidated',
          strapiRequestStartedAt: toIso(requestStartedAt),
          strapiResponseReceivedAt: toIso(responseReceivedAt),
          strapiLatencyState: responseReceivedAt - requestStartedAt,
        })
        if (RESPONSE_CACHE_TTL_MS > 0) {
          responseCache.set(cacheKey, {
            value: json,
            expiresAt: Date.now() + RESPONSE_CACHE_TTL_MS,
            staleExpiresAt: Date.now() + RESPONSE_CACHE_TTL_MS + Math.max(RESPONSE_CACHE_STALE_TTL_MS, 0),
          })
        }
        return json
      } catch (err) {
        clearTimeout(timeout)
        externalSignal?.removeEventListener('abort', abortRelay)

        const isAbortError = err instanceof DOMException && err.name === 'AbortError'
        const isTimeout = isAbortError && !externalSignal?.aborted

        if (isAbortError && externalSignal?.aborted) {
          const failureAt = Date.now()
          throw new StrapiApiError(499, 'Request Cancelled', '[Strapi] リクエストがキャンセルされました。', {
            url,
            contentType: 'unknown',
            retried: attempt,
            traceId,
            endpoint: new URL(url).pathname,
            requestStartedAt: toIso(requestStartedAt),
            failureAt: toIso(failureAt),
            latencyMs: failureAt - requestStartedAt,
            cacheState: 'miss',
          })
        }

        // タイムアウト時のみ自動再試行し、403/CORS 等の恒久エラーで待たされないようにする
        if (attempt < MAX_RETRIES && isTimeout) {
          await wait(getBackoffMs(attempt + 1))
          continue
        }

        if (err instanceof StrapiApiError) throw err

        if (isTimeout) {
          const failureAt = Date.now()
          const endpoint = new URL(url).pathname
          emitStrapiTelemetry({
            traceId,
            endpoint,
            status: 408,
            retried: attempt,
            cacheState: 'miss',
            strapiFailureState: 'timeout',
            strapiRequestStartedAt: toIso(requestStartedAt),
            strapiFailureAt: toIso(failureAt),
            strapiLatencyState: failureAt - requestStartedAt,
          })
          throw new StrapiApiError(
            408,
            'Request Timeout',
            `[Strapi] リクエストがタイムアウトしました (${effectiveTimeout}ms): ${url}`,
            {
              url,
              contentType: 'unknown',
              retried: attempt,
              traceId,
              endpoint,
              requestStartedAt: toIso(requestStartedAt),
              failureAt: toIso(failureAt),
              latencyMs: failureAt - requestStartedAt,
              cacheState: 'miss',
            },
          )
        }

        const failureAt = Date.now()
        const endpoint = new URL(url).pathname
        emitStrapiTelemetry({
          traceId,
          endpoint,
          status: 0,
          retried: attempt,
          cacheState: 'miss',
          strapiFailureState: 'network',
          strapiRequestStartedAt: toIso(requestStartedAt),
          strapiFailureAt: toIso(failureAt),
          strapiLatencyState: failureAt - requestStartedAt,
        })
        throw new StrapiApiError(
          0,
          'Network Error',
          `[Strapi] 通信に失敗しました。ネットワーク断、CORS、または Strapi 起動遅延の可能性があります: ${url}`,
          {
            url,
            contentType: 'unknown',
            retried: attempt,
            traceId,
            endpoint,
            requestStartedAt: toIso(requestStartedAt),
            failureAt: toIso(failureAt),
            latencyMs: failureAt - requestStartedAt,
            cacheState: 'miss',
          },
        )
      }
    }
    throw new StrapiApiError(0, 'Unknown Error', '[Strapi] 不明なエラーが発生しました。')
  })()

  inFlightRequests.set(cacheKey, requestPromise)
  try {
    return await requestPromise
  } finally {
    inFlightRequests.delete(cacheKey)
  }
}
