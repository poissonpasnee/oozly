import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Oozly - Colocation Australie',
  description: 'Trouvez votre coloc idéale en Australie',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
