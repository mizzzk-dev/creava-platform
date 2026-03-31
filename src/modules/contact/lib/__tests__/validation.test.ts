import { describe, it, expect } from 'vitest'
import { isRequired, isEmail, isMinLength } from '../validation'

describe('isRequired', () => {
  it('空文字は false', () => expect(isRequired('')).toBe(false))
  it('空白のみは false', () => expect(isRequired('   ')).toBe(false))
  it('値あり → true', () => expect(isRequired('山田太郎')).toBe(true))
  it('前後に空白がある値 → true', () => expect(isRequired('  a  ')).toBe(true))
})

describe('isEmail', () => {
  it('正しいメールアドレス → true', () => {
    expect(isEmail('user@example.com')).toBe(true)
    expect(isEmail('user+tag@sub.example.co.jp')).toBe(true)
  })
  it('@なし → false', () => expect(isEmail('userexample.com')).toBe(false))
  it('ドメインなし → false', () => expect(isEmail('user@')).toBe(false))
  it('空文字 → false', () => expect(isEmail('')).toBe(false))
  it('スペース含む → false', () => expect(isEmail('user @example.com')).toBe(false))
})

describe('isMinLength', () => {
  it('ちょうど min 文字 → true', () => expect(isMinLength('12345', 5)).toBe(true))
  it('min より長い → true', () => expect(isMinLength('123456', 5)).toBe(true))
  it('min より短い → false', () => expect(isMinLength('1234', 5)).toBe(false))
  it('前後の空白はトリムして判定', () => expect(isMinLength('  ab  ', 5)).toBe(false))
  it('空文字 → false (min=1)', () => expect(isMinLength('', 1)).toBe(false))
})
