import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav' // <--- NOUVEL IMPORT

export const metadata: Metadata = {
  title: 'Oozly',
  description: 'Colocation en Australie',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="pb-16 lg:pb-0"> {/* Padding en bas pour ne pas cacher le contenu derrière le menu */}
        {children}
        <BottomNav /> {/* <--- LE MENU EST ICI */}
      </body>
    </html>
  )
}
