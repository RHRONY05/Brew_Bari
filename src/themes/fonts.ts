import {
  Anek_Bangla,
  Bricolage_Grotesque,
  Cinzel,
  Hind_Siliguri,
  Libre_Baskerville,
  Plus_Jakarta_Sans,
  Poppins,
} from 'next/font/google'
import localFont from 'next/font/local'

// Curated font set for all restaurant themes. next/font needs every font at build
// time, so a theme can only pick from this list. To add a font: declare it here,
// add its key to LatinFontKey/BengaliFontKey in types.ts and to FONT_VARIABLES.
// `preload: false` because each page uses only its own theme's fonts.

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--ff-cinzel',
  display: 'swap',
  preload: false,
  weight: ['400', '500', '600', '700', '800', '900'],
})

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  variable: '--ff-libre-baskerville',
  display: 'swap',
  preload: false,
  weight: ['400', '700'],
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--ff-plus-jakarta-sans',
  display: 'swap',
  preload: false,
})

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--ff-poppins',
  display: 'swap',
  preload: false,
  weight: ['400', '500', '600', '700', '800', '900'],
})

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--ff-bricolage-grotesque',
  display: 'swap',
  preload: false,
})

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali'],
  variable: '--ff-hind-siliguri',
  display: 'swap',
  preload: false,
  weight: ['400', '500', '600', '700'],
})

const anekBangla = Anek_Bangla({
  subsets: ['bengali'],
  variable: '--ff-anek-bangla',
  display: 'swap',
  preload: false,
})

const hasanProtilipi = localFont({
  src: [
    { path: '../app/fonts/Li-Hasan-Protilipi-Unicode.ttf', weight: '400', style: 'normal' },
    { path: '../app/fonts/Li-Hasan-Protilipi-Unicode.ttf', weight: '500', style: 'normal' },
    { path: '../app/fonts/Li-Hasan-Protilipi-Unicode.ttf', weight: '600', style: 'normal' },
    { path: '../app/fonts/Li-Hasan-Protilipi-Unicode.ttf', weight: '700', style: 'normal' },
    { path: '../app/fonts/Li-Hasan-Protilipi-Unicode.ttf', weight: '800', style: 'normal' },
    { path: '../app/fonts/Li-Hasan-Protilipi-Unicode.ttf', weight: '900', style: 'normal' },
    { path: '../app/fonts/Li-Hasan-Protilipi-Unicode-Italic.ttf', weight: '400', style: 'italic' },
  ],
  variable: '--ff-hasan-protilipi',
  display: 'swap',
  preload: false,
  declarations: [{ prop: 'unicode-range', value: 'U+0980-09FF, U+200C-200D, U+25CC' }],
})

const alinurNobin = localFont({
  src: [
    { path: '../app/fonts/Li-Alinur-Nobin-Unicode.ttf', weight: '400', style: 'normal' },
    { path: '../app/fonts/Li-Alinur-Nobin-Unicode.ttf', weight: '500', style: 'normal' },
    { path: '../app/fonts/Li-Alinur-Nobin-Unicode.ttf', weight: '600', style: 'normal' },
    { path: '../app/fonts/Li-Alinur-Nobin-Unicode.ttf', weight: '700', style: 'normal' },
    { path: '../app/fonts/Li-Alinur-Nobin-Unicode.ttf', weight: '800', style: 'normal' },
    { path: '../app/fonts/Li-Alinur-Nobin-Unicode.ttf', weight: '900', style: 'normal' },
    { path: '../app/fonts/Li-Alinur-Nobin-Unicode-Italic.ttf', weight: '400', style: 'italic' },
  ],
  variable: '--ff-alinur-nobin',
  display: 'swap',
  preload: false,
  declarations: [{ prop: 'unicode-range', value: 'U+0980-09FF, U+200C-200D, U+25CC' }],
})

/** Put on <html> so every font's CSS variable exists on every page. */
export const fontVariableClasses = [
  cinzel,
  libreBaskerville,
  plusJakartaSans,
  poppins,
  bricolageGrotesque,
  hindSiliguri,
  anekBangla,
  hasanProtilipi,
  alinurNobin,
]
  .map((f) => f.variable)
  .join(' ')
