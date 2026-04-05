import { StrapiApiError } from './client'
import type { StrapiListResponse } from '@/types'

export function buildEmptyListResponse<T>(pageSize: number): StrapiListResponse<T> {
  return {
    data: [],
    meta: {
      pagination: {
        page: 1,
        pageSize,
        pageCount: 0,
        total: 0,
      },
    },
  }
}

export function isStrapiForbiddenError(error: unknown): boolean {
  return error instanceof StrapiApiError && (error.status === 401 || error.status === 403)
}
