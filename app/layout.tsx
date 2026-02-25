// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Oozly',
  description: 'Oozly',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
        {children}
      </body>
    </html>
  )
}
