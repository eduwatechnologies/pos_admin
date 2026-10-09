import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/context/auth-context'
import { ShopProvider } from '@/context/shop-context'
import { ReduxProvider } from '@/redux/provider'
import { LayoutContent } from '@/components/layout-content'
import { PWAProvider } from '@/components/pwa-provider'
import './globals.css'

const fontSans = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const fontMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Kounter POS Dashboard',
  description: 'Point of Sale Management System',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/favicon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  other: {
    'theme-color': '#0D9488',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-style': 'default',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}>
        <ReduxProvider>
          <AuthProvider>
            <ShopProvider>
              <Suspense fallback={null}>
                <LayoutContent>{children}</LayoutContent>
              </Suspense>
            </ShopProvider>
          </AuthProvider>
        </ReduxProvider>
        <PWAProvider />
        <Analytics />
      </body>
    </html>
  )
}
