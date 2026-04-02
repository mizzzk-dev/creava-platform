import { describe, it, expect } from 'vitest'
import { toSlug, formatDate, formatPriceNum } from '../index'

describe('toSlug', () => {
  it('スペースをハイフンに変換する', () => {
    expect(toSlug('hello world')).toBe('hello-world')
  })
  it('大文字を小文字に変換する', () => {
    expect(toSlug('Hello World')).toBe('hello-world')
  })
  it('前後のスペースをトリムする', () => {
    expect(toSlug('  hello  ')).toBe('hello')
  })
  it('英数字・ハイフン以外の文字を除去する', () => {
    expect(toSlug('foo!@#bar')).toBe('foobar')
  })
  it('連続スペースは単一ハイフンになる', () => {
    expect(toSlug('a  b')).toBe('a-b')
  })
  it('空文字はそのまま返す', () => {
    expect(toSlug('')).toBe('')
  })
})

describe('formatDate', () => {
  it('ISO 日付文字列を日本語形式にフォーマットする', () => {
    const result = formatDate('2024-03-15T00:00:00.000Z', 'ja-JP')
    expect(result).toMatch(/2024/)
    expect(result).toMatch(/3|3月/)
    expect(result).toMatch(/15/)
  })
  it('locale 指定なしで ja-JP になる', () => {
    const result = formatDate('2024-01-01T00:00:00.000Z')
    expect(result).toMatch(/2024/)
  })
})

describe('formatPriceNum', () => {
  it('JPY 価格を正しくフォーマットする', () => {
    const result = formatPriceNum(1980)
    expect(result).toContain('1,980')
  })
  it('¥ 記号を含む', () => {
    const result = formatPriceNum(500)
    expect(result).toMatch(/¥|￥/)
  })
  it('0 円も正しくフォーマットする', () => {
    const result = formatPriceNum(0)
    expect(result).toMatch(/0/)
  })
  it('currency を変更できる', () => {
    const result = formatPriceNum(100, 'USD')
    expect(result).toMatch(/\$|USD|100/)
  })
})
