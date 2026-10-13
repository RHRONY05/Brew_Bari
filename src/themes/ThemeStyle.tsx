import { themeCss, type Theme } from '@/themes'

/**
 * Applies a theme to the whole document while this element is mounted.
 * Rendered by restaurant pages (guest) and the staff layout; unmounts on navigation.
 */
export function ThemeStyle({ theme }: { theme: Theme }) {
  return <style data-theme={theme.key} dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />
}
