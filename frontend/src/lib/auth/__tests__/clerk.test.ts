import { describe, it, expect } from 'vitest'
import { resolveRole, toAppUser } from '../clerk'

describe('resolveRole', () => {
  it('"admin" → admin', () => expect(resolveRole('admin')).toBe('admin'))
  it('"member" → member', () => expect(resolveRole('member')).toBe('member'))
  it('"guest" → guest', () => expect(resolveRole('guest')).toBe('guest'))
  it('未設定 (undefined) → guest', () => expect(resolveRole(undefined)).toBe('guest'))
  it('null → guest', () => expect(resolveRole(null)).toBe('guest'))
  it('不正な文字列 → guest', () => expect(resolveRole('superadmin')).toBe('guest'))
  it('数値 → guest', () => expect(resolveRole(1)).toBe('guest'))
})

describe('toAppUser', () => {
  it('通常ユーザー（member）を正しく変換する', () => {
    const result = toAppUser({
      id: 'user_123',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      publicMetadata: { role: 'member' },
    })
    expect(result).toEqual({ id: 'user_123', email: 'test@example.com', role: 'member' })
  })

  it('メールアドレスが null の場合 email: null になる', () => {
    const result = toAppUser({
      id: 'user_456',
      primaryEmailAddress: null,
      publicMetadata: {},
    })
    expect(result.email).toBeNull()
  })

  it('publicMetadata.role が未設定の場合 role: guest になる', () => {
    const result = toAppUser({
      id: 'user_789',
      primaryEmailAddress: { emailAddress: 'a@b.com' },
      publicMetadata: {},
    })
    expect(result.role).toBe('guest')
  })

  it('admin ロールが正しく変換される', () => {
    const result = toAppUser({
      id: 'admin_1',
      primaryEmailAddress: { emailAddress: 'admin@example.com' },
      publicMetadata: { role: 'admin' },
    })
    expect(result.role).toBe('admin')
  })
})
