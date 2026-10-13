export type Localized = { en: string; bn: string }

export type LatinFontKey =
  | 'cinzel'
  | 'libre-baskerville'
  | 'plus-jakarta-sans'
  | 'poppins'
  | 'bricolage-grotesque'

export type BengaliFontKey =
  | 'hasan-protilipi'
  | 'hind-siliguri'
  | 'anek-bangla'
  | 'alinur-nobin'

/** CSS variables a theme may override. Defaults live in src/app/globals.css (:root) and equal the Brew Bari look. */
export type ThemeToken =
  | 'bg'
  | 'surface'
  | 'surface-2'
  | 'surface-subtle'
  | 'line'
  | 'line-soft'
  | 'ink'
  | 'ink-2'
  | 'ink-3'
  | 'brand'
  | 'brand-muted'
  | 'brand-dark'
  | 'brand-ink'
  | 'accent'
  | 'accent-ink'
  | 'accent-strong'
  | 'success'
  | 'success-soft'
  | 'warning'
  | 'warning-soft'
  | 'pending-soft'
  | 'danger'
  | 'danger-soft'
  | 'info'
  | 'info-soft'
  | 'overlay'
  | 'r-sm'
  | 'r-md'
  | 'r-lg'
  | 'r-xl'
  | 'radius'
  // space-separated RGB triplets, used as rgb(var(--x)/alpha)
  | 'shadow-rgb'
  | 'ink-rgb'
  | 'accent-rgb'
  // offer banner
  | 'offer-from'
  | 'offer-via'
  | 'offer-to'
  | 'offer-shadow-rgb'
  | 'offer-image-bg'
  // offer banner decoration palette (used by layout.offerDecoration)
  | 'deco-1'
  | 'deco-2'
  | 'deco-3'
  | 'deco-4'
  | 'deco-5'
  | 'deco-6'
  | 'deco-7'
  | 'deco-8'
  // printed / downloaded QR cards
  | 'paper'
  | 'paper-line'
  | 'paper-ink'

export interface Theme {
  /** Matches restaurants.theme_key in the database. */
  key: string
  /** Human name, for docs and the platform home. */
  name: string
  /** Overrides of the default tokens. Omit a token to keep the default. */
  tokens: Partial<Record<ThemeToken, string>>
  fonts: {
    heading: LatinFontKey
    body: LatinFontKey
    bengali: BengaliFontKey
  }
  /**
   * Layout variants. Each option is a ready-made building block; restaurants mix them.
   * Add new options here (and implement them in the component) instead of forking components.
   */
  layout: {
    /** Decorative artwork behind the offer banner image. */
    offerDecoration: 'liquid-splash' | 'none'
    /** Banner or hero card offer carousel presentation. */
    offerStyle: 'banner' | 'hero'
    /** Category navigation layout: chips or round icon circles. */
    categoryNav: 'chips' | 'round-icons'
    /** Item card presentation style: standard or bold fast-food card. */
    itemCard: 'standard' | 'bold'
    /** Whether to render a horizontal meal deals row above categories. */
    dealsRow: boolean
    /** Quick items presentation: section chip or dark banner. */
    quickPicks: 'section' | 'banner'
    /** Whether to render 'Goes well with' upsell carousel in the cart. */
    cartUpsell: boolean
    /** Table order tracking status card: standard or dark hero card. */
    statusCard: 'standard' | 'hero'
  }
  icons: {
    /** Icon on the "Table N" chip in the guest header. */
    venue: 'coffee' | 'utensils'
  }
  copy: {
    searchPlaceholder: Localized
    infoLabel: Localized
    statusPreparing?: Localized
    placeOrder?: Localized
    dealsTitle?: Localized
    quickBannerTitle?: Localized
    quickBannerSubtitle?: Localized
  }
  assets: {
    /** Used when restaurants.logo_url is empty. Path under /public. */
    logo: string
  }
}
