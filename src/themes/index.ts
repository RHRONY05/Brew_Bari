import { brewBariTheme } from './brew-bari'
import { menuwalaTheme } from './menuwala'
import type { BengaliFontKey, LatinFontKey, Theme } from './types'

export type { Theme, ThemeToken, Localized } from './types'

/** Every restaurant theme, keyed by restaurants.theme_key. Register new themes here. */
export const THEMES: Record<string, Theme> = {
  [brewBariTheme.key]: brewBariTheme,
}

export const PLATFORM_THEME = menuwalaTheme
export const DEFAULT_THEME = brewBariTheme

export function getTheme(key: string | null | undefined): Theme {
  return (key && THEMES[key]) || DEFAULT_THEME
}

const FONT_VARIABLES: Record<LatinFontKey | BengaliFontKey, string> = {
  cinzel: '--ff-cinzel',
  'libre-baskerville': '--ff-libre-baskerville',
  'plus-jakarta-sans': '--ff-plus-jakarta-sans',
  poppins: '--ff-poppins',
  'bricolage-grotesque': '--ff-bricolage-grotesque',
  'hasan-protilipi': '--ff-hasan-protilipi',
  'hind-siliguri': '--ff-hind-siliguri',
  'anek-bangla': '--ff-anek-bangla',
}

/** CSS that applies a theme to the whole document (including portalled sheets and dialogs). */
export function themeCss(theme: Theme): string {
  const decls = Object.entries(theme.tokens).map(([name, value]) => `--${name}:${value};`)
  decls.push(`--theme-font-heading:var(${FONT_VARIABLES[theme.fonts.heading]});`)
  decls.push(`--theme-font-body:var(${FONT_VARIABLES[theme.fonts.body]});`)
  decls.push(`--theme-font-bengali:var(${FONT_VARIABLES[theme.fonts.bengali]});`)
  // html:root beats the :root defaults in globals.css regardless of stylesheet order
  return `html:root{${decls.join('')}}`
}
