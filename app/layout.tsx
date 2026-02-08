'use client'
import './globals.css'
import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('home')

  // Synchronisation Dark Mode Global
  useEffect(() => {
    const theme = localStorage.getItem('theme')
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Détection onglet actif
  useEffect(() => {
    if (pathname === '/') setActiveTab('home')
    else if (pathname === '/favorites') setActiveTab('favorites')
    else if (pathname === '/map') setActiveTab('map') // NOUVEAU
    else if (pathname === '/publish') setActiveTab('publish')
    else if (pathname === '/inbox') setActiveTab('inbox')
    else if (pathname === '/profile') setActiveTab('profile')
  }, [pathname])

  // Ne pas afficher la nav sur la page login ou admin
  const showNav = !pathname?.startsWith('/login') && !pathname?.startsWith('/admin')

  return (
    <html lang="fr" className="antialiased">
      <body className={`${inter.className} bg-stone-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300`}>
        {children}
        
        {/* BARRE DE NAVIGATION DU BAS (MOBILE ONLY) */}
        {showNav && (
          <div className="lg:hidden fixed bottom-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around py-3 pb-6 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            <Link href="/" className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`}>
              <svg className="w-6 h-6" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-[10px] font-medium">Explorer</span>
            </Link>

            <Link href="/favorites" className={`flex flex-col items-center gap-1 ${activeTab === 'favorites' ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`}>
              <svg className="w-6 h-6" fill={activeTab === 'favorites' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              <span className="text-[10px] font-medium">Favoris</span>
            </Link>
            
            {/* NOUVEAU BOUTON CARTE AU MILIEU */}
            <Link href="/map" className={`flex flex-col items-center gap-1 ${activeTab === 'map' ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`}>
              <svg className="w-6 h-6" fill={activeTab === 'map' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              <span className="text-[10px] font-medium">Carte</span>
            </Link>

            <Link href="/publish" className={`flex flex-col items-center gap-1 ${activeTab === 'publish' ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span className="text-[10px] font-medium">Publier</span>
            </Link>

            <Link href="/profile" className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`}>
               <svg className="w-6 h-6" fill={activeTab === 'profile' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="text-[10px] font-medium">Profil</span>
            </Link>
          </div>
        )}
      </body>
    </html>
  )
}
