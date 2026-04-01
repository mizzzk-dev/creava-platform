/**
 * Strapi API エラー
 */
export class StrapiApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    message: string,
  ) {
    super(message)
    this.name = 'StrapiApiError'
  }
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
    baseUrl: baseUrl.replace(/\/$/, ''), // 末尾スラッシュを除去
    token: import.meta.env.VITE_STRAPI_API_TOKEN || undefined,
  }
}

/**
 * Strapi API への GET リクエスト共通クライアント
 *
 * @param path      - `/api` 以降のパス（例: `/news-items`）
 * @param queryString - buildQueryString() で生成したクエリ文字列（例: `?populate=*`）
 */
export async function strapiGet<T>(
  path: string,
  queryString: string = '',
): Promise<T> {
  const { baseUrl, token } = getStrapiConfig()

  const url = `${baseUrl}/api${path}${queryString}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { headers })

  if (!res.ok) {
    throw new StrapiApiError(
      res.status,
      res.statusText,
      `[Strapi] ${res.status} ${res.statusText} — ${url}`,
    )
  }

  return res.json() as Promise<T>
}
