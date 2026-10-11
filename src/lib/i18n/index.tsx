'use client'

import React, { createContext, useContext, useState, useTransition } from 'react'
import { en, type TranslationDictionary } from './en'
import { bn } from './bn'
import type { Locale } from '@/lib/money'

export type { TranslationDictionary }
export { en, bn }

const dictionaries: Record<Locale, TranslationDictionary> = { en, bn }

export function getDictionary(locale: Locale): TranslationDictionary {
  return dictionaries[locale] || en
}

/**
 * Pick localized string from a database row.
 * Falls back to English if Bengali value is missing or null.
 */
export function pick<
  T extends Record<string, unknown>,
  K extends string
>(
  row: T | null | undefined,
  field: K,
  locale: Locale = 'en'
): string {
  if (!row) return ''
  const bnKey = `${field}_bn` as keyof T
  const enKey = `${field}_en` as keyof T

  if (locale === 'bn') {
    const val = row[bnKey]
    if (typeof val === 'string' && val.trim().length > 0) return val
  }
  const fallback = row[enKey]
  if (typeof fallback === 'string') return fallback
  return ''
}

interface I18nContextType {
  locale: Locale
  setLocale: (next: Locale) => void
  t: TranslationDictionary
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: en,
})

export function I18nProvider({
  initialLocale = 'en',
  children,
}: {
  initialLocale?: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )lang=([a-z]{2})/)
      if (match && (match[1] === 'en' || match[1] === 'bn')) {
        return match[1] as Locale
      }
    }
    return initialLocale
  })
  const [, startTransition] = useTransition()

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    document.cookie = `lang=${next}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.lang = next
    startTransition(() => {
      // triggers reactive client update
    })
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: getDictionary(locale) }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useT() {
  const ctx = useContext(I18nContext)
  return ctx
}
