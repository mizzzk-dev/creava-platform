/**
 * Strapi API クエリパラメータの型定義
 *
 * populate / filters / sort / pagination / locale など
 * Strapi v5 の主要なクエリオプションをカバーする
 */
export interface StrapiQueryParams {
  /** フィールド選択: ['title', 'slug'] */
  fields?: string[]
  /** リレーション展開: '*' | ['image', 'author'] | { image: { fields: ['url'] } } */
  populate?: string | string[] | Record<string, unknown>
  /** フィルタ条件: { status: { $eq: 'public' } } */
  filters?: Record<string, unknown>
  /** ソート: 'publishAt:desc' | ['publishAt:desc', 'title:asc'] */
  sort?: string | string[]
  /** ページネーション */
  pagination?: {
    page?: number
    pageSize?: number
    withCount?: boolean
  }
  /** ロケール（多言語対応時） */
  locale?: string
  /**
   * Strapi v5 コンテンツ公開状態フィルター
   * - 'published': 公開済みのみ（デフォルト。未指定時も同動作）
   * - 'draft': 下書き含む（API Token が必要）
   */
  status?: 'published' | 'draft'
}

/**
 * URLSearchParams への再帰的なシリアライズ
 *
 * 例:
 *  { filters: { status: { $eq: 'public' } } }
 *  → filters[status][$eq]=public
 */
function serializeValue(
  params: URLSearchParams,
  key: string,
  value: unknown,
): void {
  if (value === undefined || value === null) return

  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      serializeValue(params, `${key}[${i}]`, item)
    })
  } else if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      serializeValue(params, `${key}[${k}]`, v)
    })
  } else {
    params.append(key, String(value))
  }
}

/**
 * StrapiQueryParams をクエリ文字列に変換する
 *
 * @returns `?populate=*&sort[0]=publishAt%3Adesc` のような文字列
 *          パラメータが空の場合は空文字列を返す
 */
export function buildQueryString(queryParams: StrapiQueryParams): string {
  const params = new URLSearchParams()

  Object.entries(queryParams).forEach(([key, value]) => {
    serializeValue(params, key, value)
  })

  const qs = params.toString()
  return qs ? `?${qs}` : ''
}
