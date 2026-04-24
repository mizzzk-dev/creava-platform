import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fetchCollection } from '@/lib/cms/wordpress'

describe('wordpress cms pagination/visibility compatibility', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_WORDPRESS_API_URL', 'https://example.com/wp-json/creava/v1')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('pageSize が欠落していても request 側の pageSize fallback を利用する', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [{ id: 1, slug: 'limited-sample', accessStatus: 'limited', limitedEndAt: '2099-01-01T00:00:00.000Z', archiveVisibleForFC: false }],
      meta: { pagination: { page: 1, total: 50 } },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })))

    const result = await fetchCollection('/blog-posts', { pagination: { page: 1, pageSize: 16 } })

    expect(result.meta.pagination!.pageSize).toBe(16)
    expect(result.meta.pagination!.total).toBe(50)
  })

  it('pageSize 未指定でも 12 の default を維持して 1 件固定化を防ぐ', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [{ id: 1, slug: 'a' }],
      meta: {},
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })))

    const result = await fetchCollection('/blog-posts')

    expect(result.meta.pagination!.pageSize).toBe(12)
    expect(result.meta.pagination!.pageCount).toBe(1)
  })

  it('invalid page/pageSize クエリも WordPress 側に送って clamp 対象にする', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [], meta: { pagination: { page: 1, pageSize: 12, pageCount: 0, total: 0 } } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    await fetchCollection('/news-items', { pagination: { page: -5, pageSize: 0 } })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/wp-json/creava/v1/news?page=-5&pageSize=0',
      expect.any(Object),
    )
  })
})
