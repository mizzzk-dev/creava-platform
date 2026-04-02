import { describe, it, expect } from 'vitest'
import { buildQueryString } from '../query'

describe('buildQueryString', () => {
  it('空オブジェクトなら空文字を返す', () => {
    expect(buildQueryString({})).toBe('')
  })

  it('sort (string) を正しくシリアライズする', () => {
    const qs = buildQueryString({ sort: 'publishAt:desc' })
    expect(qs).toBe('?sort=publishAt%3Adesc')
  })

  it('sort (配列) を正しくシリアライズする', () => {
    const qs = buildQueryString({ sort: ['publishAt:desc', 'title:asc'] })
    expect(qs).toContain('sort%5B0%5D=publishAt')
    expect(qs).toContain('sort%5B1%5D=title')
  })

  it('populate: * を正しくシリアライズする', () => {
    const qs = buildQueryString({ populate: '*' })
    // URLSearchParams は * をエンコードしない
    expect(qs).toBe('?populate=*')
  })

  it('populate (配列) を正しくシリアライズする', () => {
    const qs = buildQueryString({ populate: ['image', 'author'] })
    expect(qs).toContain('populate%5B0%5D=image')
    expect(qs).toContain('populate%5B1%5D=author')
  })

  it('pagination を正しくシリアライズする', () => {
    const qs = buildQueryString({ pagination: { page: 2, pageSize: 10 } })
    expect(qs).toContain('pagination%5Bpage%5D=2')
    expect(qs).toContain('pagination%5BpageSize%5D=10')
  })

  it('filters のネスト構造を正しくシリアライズする', () => {
    const qs = buildQueryString({ filters: { status: { $eq: 'public' } } })
    expect(qs).toContain('filters%5Bstatus%5D%5B%24eq%5D=public')
  })

  it('locale を正しくシリアライズする', () => {
    const qs = buildQueryString({ locale: 'ja' })
    expect(qs).toBe('?locale=ja')
  })

  it('undefined / null の値はスキップする', () => {
    const qs = buildQueryString({ locale: undefined, sort: undefined })
    expect(qs).toBe('')
  })

  it('複数パラメータを同時にシリアライズする', () => {
    const qs = buildQueryString({
      sort: 'publishAt:desc',
      pagination: { pageSize: 5 },
      locale: 'ja',
    })
    expect(qs).toContain('sort=')
    expect(qs).toContain('pagination')
    expect(qs).toContain('locale=ja')
    expect(qs.startsWith('?')).toBe(true)
  })
})
