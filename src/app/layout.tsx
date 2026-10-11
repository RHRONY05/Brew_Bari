import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Hind_Siliguri } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali',
  display: 'swap',
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
    <html lang="en" className={`${plusJakartaSans.variable} ${hindSiliguri.variable} antialiased`}>
      <body className="min-h-screen bg-background text-foreground font-sans">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
