import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/context/auth-context'
import { ShopProvider } from '@/context/shop-context'
import { SyncProvider } from '@/context/sync-context'
import { ReduxProvider } from '@/redux/provider'
import { LayoutContent } from '@/components/layout-content'
import './globals.css'

const fontSans = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const fontMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Kounter POS Dashboard',
  description: 'Point of Sale Management System',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/kounterLogo.jpeg',
      },
    ],
    apple: '/kounterLogo.jpeg',
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
              <SyncProvider>
                <LayoutContent>{children}</LayoutContent>
              </SyncProvider>
            </ShopProvider>
          </AuthProvider>
        </ReduxProvider>
        <Analytics />
      </body>
    </html>
  )
}
