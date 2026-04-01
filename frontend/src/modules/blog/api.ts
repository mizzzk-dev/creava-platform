import { fetchCollection, fetchBySlug } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { BlogPost, StrapiListResponse } from '@/types'

const ENDPOINT = '/blog-posts'

/**
 * ブログ記事一覧を取得する
 */
export function getBlogList(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<BlogPost>> {
  return fetchCollection<BlogPost>(ENDPOINT, {
    sort: ['publishAt:desc'],
    ...params,
  })
}

/**
 * スラッグでブログ記事詳細を取得する
 */
export function getBlogDetail(
  slug: string,
  params?: Omit<StrapiQueryParams, 'filters' | 'pagination'>,
): Promise<BlogPost | null> {
  return fetchBySlug<BlogPost>(ENDPOINT, slug, params)
}
