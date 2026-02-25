import AuthDebug from '@/app/components/AuthDebug'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthDebug />
        {children}
      </body>
    </html>
  )
}
