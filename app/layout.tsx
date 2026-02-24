import './globals.css'
import BottomNav from '@/components/BottomNav'

export const metadata = {
  title: 'Oozly',
  description: 'Colocation Australie',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
