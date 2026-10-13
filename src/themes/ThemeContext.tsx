'use client'

import { createContext, useContext } from 'react'
import { Coffee, UtensilsCrossed, type LucideProps } from 'lucide-react'
import { DEFAULT_THEME, type Theme } from '@/themes'

const ThemeContext = createContext<Theme>(DEFAULT_THEME)

/** Gives client components the current restaurant's theme (layout variants, icons, copy). */
export const ThemeProvider = ThemeContext.Provider

export function useTheme(): Theme {
  return useContext(ThemeContext)
}

/** The restaurant's "venue" icon: a cup for cafés, cutlery for restaurants. Used for placeholders. */
export function VenueIcon(props: LucideProps) {
  const theme = useTheme()
  const Icon = theme.icons.venue === 'coffee' ? Coffee : UtensilsCrossed
  return <Icon {...props} />
}
