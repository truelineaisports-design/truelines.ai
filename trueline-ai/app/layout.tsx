import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import Providers from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'TrueLinesAI',
  description: 'AI-Powered NBA Parlay Generator',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ backgroundColor: '#0a0a0f', color: '#ffffff', minHeight: '100vh' }}>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}