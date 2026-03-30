/**
 * Strapi コンテンツの公開ステータス
 * - public:    全員閲覧可
 * - fc_only:   member 以上
 * - limited:   期限あり（期限後は archiveVisibleForFC に従う）
 */
export type ContentStatus = 'public' | 'fc_only' | 'limited'

/**
 * Strapi 共通フィールド
 */
export interface StrapiBase {
  id: number
  documentId: string
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

/**
 * すべてのコンテンツが持つ共通フィールド
 */
export interface ContentBase extends StrapiBase {
  title: string
  slug: string
  status: ContentStatus
  publishAt: string | null
  limitedEndAt: string | null
  archiveVisibleForFC: boolean
}

/**
 * Strapi レスポンスの汎用ラッパー
 */
export interface StrapiResponse<T> {
  data: T
  meta: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface StrapiListResponse<T> extends StrapiResponse<T[]> {}
export interface StrapiSingleResponse<T> extends StrapiResponse<T> {}

/**
 * 各コンテンツ型（最小定義。詳細フィールドは各モジュールで拡張する）
 */
export interface Profile extends ContentBase {
  bio: string | null
  avatarUrl: string | null
}

export interface Work extends ContentBase {
  description: string | null
  thumbnailUrl: string | null
  category: string | null
}

export interface NewsItem extends ContentBase {
  body: string | null
  thumbnailUrl: string | null
}

export interface BlogPost extends ContentBase {
  body: string | null
  thumbnailUrl: string | null
  tags: string[]
}

export interface Event extends ContentBase {
  description: string | null
  startAt: string | null
  endAt: string | null
  venue: string | null
}

export interface FanclubContent extends ContentBase {
  body: string | null
  thumbnailUrl: string | null
}

/**
 * サイト設定（Strapi Single Type: site-setting）
 */
export interface SiteSettings extends StrapiBase {
  siteName: string
  description: string | null
  logoUrl: string | null
}
