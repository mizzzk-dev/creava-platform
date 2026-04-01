import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { canViewContent } from '../index'

// テスト用の固定日時 (2025-06-01)
const NOW = new Date('2025-06-01T00:00:00Z')
const FUTURE = '2025-12-31T00:00:00Z'  // NOW より後
const PAST = '2025-01-01T00:00:00Z'    // NOW より前

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('canViewContent — public', () => {
  it('guest でも閲覧できる', () => {
    expect(canViewContent({ status: 'public', role: 'guest', limitedEndAt: null, archiveVisibleForFC: false })).toBe(true)
  })
  it('member でも閲覧できる', () => {
    expect(canViewContent({ status: 'public', role: 'member', limitedEndAt: null, archiveVisibleForFC: false })).toBe(true)
  })
  it('admin でも閲覧できる', () => {
    expect(canViewContent({ status: 'public', role: 'admin', limitedEndAt: null, archiveVisibleForFC: false })).toBe(true)
  })
})

describe('canViewContent — fc_only', () => {
  it('guest は閲覧不可', () => {
    expect(canViewContent({ status: 'fc_only', role: 'guest', limitedEndAt: null, archiveVisibleForFC: false })).toBe(false)
  })
  it('member は閲覧可', () => {
    expect(canViewContent({ status: 'fc_only', role: 'member', limitedEndAt: null, archiveVisibleForFC: false })).toBe(true)
  })
  it('admin は閲覧可', () => {
    expect(canViewContent({ status: 'fc_only', role: 'admin', limitedEndAt: null, archiveVisibleForFC: false })).toBe(true)
  })
})

describe('canViewContent — limited (期限内)', () => {
  it('guest でも期限内なら閲覧可', () => {
    expect(canViewContent({ status: 'limited', role: 'guest', limitedEndAt: FUTURE, archiveVisibleForFC: false })).toBe(true)
  })
  it('limitedEndAt が null なら全員閲覧可', () => {
    expect(canViewContent({ status: 'limited', role: 'guest', limitedEndAt: null, archiveVisibleForFC: false })).toBe(true)
  })
})

describe('canViewContent — limited (期限後)', () => {
  it('archiveVisibleForFC=false なら全員閲覧不可', () => {
    expect(canViewContent({ status: 'limited', role: 'guest', limitedEndAt: PAST, archiveVisibleForFC: false })).toBe(false)
    expect(canViewContent({ status: 'limited', role: 'member', limitedEndAt: PAST, archiveVisibleForFC: false })).toBe(false)
  })
  it('archiveVisibleForFC=true なら member/admin のみ閲覧可', () => {
    expect(canViewContent({ status: 'limited', role: 'guest', limitedEndAt: PAST, archiveVisibleForFC: true })).toBe(false)
    expect(canViewContent({ status: 'limited', role: 'member', limitedEndAt: PAST, archiveVisibleForFC: true })).toBe(true)
    expect(canViewContent({ status: 'limited', role: 'admin', limitedEndAt: PAST, archiveVisibleForFC: true })).toBe(true)
  })
})
