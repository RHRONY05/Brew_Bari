import { describe, it, expect } from 'vitest'
import { en } from '@/lib/i18n/en'
import { bn } from '@/lib/i18n/bn'
import { pick } from '@/lib/i18n'

describe('i18n dictionary structure', () => {
  it('bn dictionary has every top-level category of en', () => {
    const enSections = Object.keys(en)
    const bnSections = Object.keys(bn)
    expect(bnSections).toEqual(expect.arrayContaining(enSections))
  })

  it('bn dictionary has every nested key of en recursively', () => {
    function compareKeys(
      enObj: Record<string, unknown>,
      bnObj: Record<string, unknown>,
      path = ''
    ) {
      for (const key of Object.keys(enObj)) {
        const currentPath = path ? `${path}.${key}` : key
        expect(bnObj).toHaveProperty(key)
        const enVal = enObj[key]
        const bnVal = bnObj[key]
        if (typeof enVal === 'object' && enVal !== null) {
          expect(typeof bnVal).toBe('object')
          compareKeys(
            enVal as Record<string, unknown>,
            bnVal as Record<string, unknown>,
            currentPath
          )
        } else {
          expect(typeof bnVal).toBe('string')
          expect((bnVal as string).length).toBeGreaterThan(0)
        }
      }
    }

    compareKeys(
      en as unknown as Record<string, unknown>,
      bn as unknown as Record<string, unknown>
    )
  })
})

describe('pick(row, field, locale) helper', () => {
  const row = {
    name_en: 'Café Latte',
    name_bn: 'ক্যাফে লাতে',
    description_en: 'Smooth espresso with steamed milk',
    description_bn: null,
  }

  it('picks Bengali when requested and present', () => {
    expect(pick(row, 'name', 'bn')).toBe('ক্যাফে লাতে')
  })

  it('picks English when requested', () => {
    expect(pick(row, 'name', 'en')).toBe('Café Latte')
  })

  it('falls back to English when Bengali is missing/null', () => {
    expect(pick(row, 'description', 'bn')).toBe(
      'Smooth espresso with steamed milk'
    )
  })

  it('handles null row safely', () => {
    expect(pick(null, 'name', 'en')).toBe('')
  })
})
