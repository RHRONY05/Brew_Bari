import { describe, it, expect } from 'vitest'
import { getTheme, themeCss, DEFAULT_THEME, PLATFORM_THEME, THEMES } from '@/themes'
import { menuPath, tablePath, menuUrl, tableUrl } from '@/lib/site-urls'

describe('theme registry', () => {
  it('returns the registered theme for a known key', () => {
    expect(getTheme('brew-bari').key).toBe('brew-bari')
  })

  it('falls back to the default theme for unknown or empty keys', () => {
    expect(getTheme('does-not-exist')).toBe(DEFAULT_THEME)
    expect(getTheme(null)).toBe(DEFAULT_THEME)
    expect(getTheme(undefined)).toBe(DEFAULT_THEME)
  })

  it('every registered theme is keyed by its own key', () => {
    for (const [key, theme] of Object.entries(THEMES)) {
      expect(theme.key).toBe(key)
    }
  })
})

describe('themeCss', () => {
  it('maps fonts to the curated font variables', () => {
    const css = themeCss(DEFAULT_THEME)
    expect(css).toContain('--theme-font-heading:var(--ff-cinzel);')
    expect(css).toContain('--theme-font-body:var(--ff-libre-baskerville);')
    expect(css).toContain('--theme-font-bengali:var(--ff-hasan-protilipi);')
  })

  it('emits token overrides on html:root', () => {
    const css = themeCss(PLATFORM_THEME)
    expect(css.startsWith('html:root{')).toBe(true)
    expect(css).toContain('--brand:#1F4D3A;')
    expect(css).toContain('--shadow-rgb:31 77 58;')
  })
})

describe('site URLs', () => {
  it('builds slug-based guest paths', () => {
    expect(menuPath('brew-bari')).toBe('/brew-bari')
    expect(tablePath('brew-bari', 'abc123')).toBe('/brew-bari/t/abc123')
  })

  it('builds absolute URLs for QR codes', () => {
    expect(menuUrl('https://menuwala.vercel.app', 'grill-ghar')).toBe('https://menuwala.vercel.app/grill-ghar')
    expect(tableUrl('https://menuwala.vercel.app', 'grill-ghar', 't1')).toBe(
      'https://menuwala.vercel.app/grill-ghar/t/t1'
    )
  })
})
