import { describe, it, expect } from 'vitest'
import { formatTaka } from '@/lib/money'

describe('formatTaka(amount, locale)', () => {
  it('formats whole taka in English correctly', () => {
    expect(formatTaka(250, 'en')).toBe('৳250')
    expect(formatTaka(1250, 'en')).toBe('৳1,250')
  })

  it('formats whole taka in Bengali digits correctly', () => {
    expect(formatTaka(250, 'bn')).toBe('৳২৫০')
    expect(formatTaka(1250, 'bn')).toBe('৳১,২৫০')
  })

  it('rounds decimal numbers to whole taka', () => {
    expect(formatTaka(249.6, 'en')).toBe('৳250')
    expect(formatTaka(249.4, 'en')).toBe('৳249')
  })

  it('defaults to English locale when omitted', () => {
    expect(formatTaka(500)).toBe('৳500')
  })
})
