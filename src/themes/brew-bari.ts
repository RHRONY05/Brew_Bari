import type { Theme } from './types'

// The default tokens in globals.css ARE the Brew Bari look, so no overrides are needed.
export const brewBariTheme: Theme = {
  key: 'brew-bari',
  name: 'Brew Bari — café (cream & caramel)',
  tokens: {},
  fonts: {
    heading: 'cinzel',
    body: 'libre-baskerville',
    bengali: 'hasan-protilipi',
  },
  layout: {
    offerDecoration: 'liquid-splash',
    offerStyle: 'banner',
    categoryNav: 'chips',
    itemCard: 'standard',
    dealsRow: false,
    quickPicks: 'section',
    cartUpsell: false,
    statusCard: 'standard',
  },
  icons: {
    venue: 'coffee',
  },
  copy: {
    searchPlaceholder: { en: 'Search coffee, juice, bites…', bn: 'কফি, জুস, স্ন্যাকস খুঁজুন…' },
    infoLabel: { en: 'Café info', bn: 'ক্যাফের তথ্য' },
  },
  assets: {
    logo: '/images/brand/concept-1.png',
  },
}
