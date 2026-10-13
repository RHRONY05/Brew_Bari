import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { fontVariableClasses } from '@/themes/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Menuwala — QR menus & table ordering',
    template: '%s',
  },
  description: 'Digital QR menus, table service and ordering for restaurants in Bangladesh.',
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
      className={`${fontVariableClasses} antialiased`}
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
