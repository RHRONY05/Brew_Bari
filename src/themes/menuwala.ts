import type { Theme } from './types'

// The platform's own look (home page, not-found). Deep green + saffron.
export const menuwalaTheme: Theme = {
  key: 'menuwala',
  name: 'Menuwala — platform',
  tokens: {
    bg: '#F6F3EA',
    surface: '#FFFFFF',
    'surface-2': '#EAE5D6',
    'surface-subtle': '#FBF9F3',
    line: '#E0D9C6',
    'line-soft': '#ECE7DA',
    ink: '#16201B',
    'ink-2': '#4C5952',
    'ink-3': '#6E7A73',
    brand: '#1F4D3A',
    'brand-muted': '#2E6A51',
    'brand-dark': '#153829',
    'brand-ink': '#F6F3EA',
    accent: '#F3B640',
    'accent-ink': '#16201B',
    'accent-strong': '#E0A12A',
    'shadow-rgb': '31 77 58',
    'ink-rgb': '22 32 27',
    'accent-rgb': '224 161 42',
  },
  fonts: {
    heading: 'plus-jakarta-sans',
    body: 'plus-jakarta-sans',
    bengali: 'hind-siliguri',
  },
  layout: {
    offerDecoration: 'none',
    offerStyle: 'banner',
    categoryNav: 'chips',
    itemCard: 'standard',
    dealsRow: false,
    quickPicks: 'section',
    cartUpsell: false,
    statusCard: 'standard',
  },
  icons: {
    venue: 'utensils',
  },
  copy: {
    searchPlaceholder: { en: 'Search the menu…', bn: 'মেন্যুতে খুঁজুন…' },
    infoLabel: { en: 'Restaurant info', bn: 'রেস্টুরেন্টের তথ্য' },
  },
  assets: {
    logo: '/images/brand/menuwala.svg',
  },
}
