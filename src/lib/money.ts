export type Locale = 'en' | 'bn'

/**
 * Formats an amount as an integer number of Taka with the ৳ symbol.
 * Example: formatTaka(250, 'en') -> '৳250'
 * Example: formatTaka(1250, 'bn') -> '৳১,২৫০'
 */
export function formatTaka(amount: number, locale: Locale = 'en'): string {
  const rounded = Math.round(amount)
  const formatter = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-BD')
  return `৳${formatter.format(rounded)}`
}
