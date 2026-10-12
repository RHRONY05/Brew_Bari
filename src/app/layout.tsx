import type { Metadata } from 'next'
import { Cinzel, Libre_Baskerville } from 'next/font/google'
import localFont from 'next/font/local'
import { Toaster } from 'sonner'
import './globals.css'

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '700'],
})

const hasanProtilipi = localFont({
  src: [
    {
      path: './fonts/Li-Hasan-Protilipi-Unicode.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Li-Hasan-Protilipi-Unicode.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/Li-Hasan-Protilipi-Unicode.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: './fonts/Li-Hasan-Protilipi-Unicode.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/Li-Hasan-Protilipi-Unicode.ttf',
      weight: '800',
      style: 'normal',
    },
    {
      path: './fonts/Li-Hasan-Protilipi-Unicode.ttf',
      weight: '900',
      style: 'normal',
    },
    {
      path: './fonts/Li-Hasan-Protilipi-Unicode-Italic.ttf',
      weight: '400',
      style: 'italic',
    },
  ],
  variable: '--font-bengali',
  display: 'swap',
  declarations: [
    {
      prop: 'unicode-range',
      value: 'U+0980-09FF, U+200C-200D, U+25CC',
    },
  ],
})

export const metadata: Metadata = {
  title: 'Brew Bari | Coffee & Juice Shop',
  description: 'Digital QR menu and table service experience',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cinzel.variable} ${libreBaskerville.variable} ${hasanProtilipi.variable} antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|; )lang=([a-z]{2})/);var l=m?m[1]:'en';if(l==='bn'){document.documentElement.lang='bn';document.documentElement.setAttribute('data-lang','bn');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
