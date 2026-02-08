'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('home')

  // Synchronisation Dark Mode Global
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const theme = localStorage.getItem('theme')
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  // Détection onglet actif
  useEffect(() => {
    if (pathname === '/') setActiveTab('home')
    else if (pathname === '/favorites') setActiveTab('favorites')
    else if (pathname === '/map') setActiveTab('map')
    else if (pathname === '/publish') setActiveTab('publish')
    else if (pathname === '/profile') setActiveTab('profile')
  }, [pathname])

  // Masquer la nav sur login/admin
  const showNav = !pathname?.startsWith('/login') && !pathname?.startsWith('/admin')

  return (
    <html lang="fr" className="antialiased">
      <body className={`${inter.className} bg-stone-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 pb-28 lg:pb-0`}>
        {children}
        
        {/* BARRE DE NAVIGATION FLOTTANTE (MOBILE) */}
        {showNav && (
          <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-700 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex justify-around items-center py-3 px-2">
              
              {/* EXPLORER */}
              <Link href="/" className={`relative group flex flex-col items-center gap-1 w-12 transition-all ${activeTab === 'home' ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`}>
                <div className={`absolute -top-8 w-8 h-1 bg-rose-500 rounded-full transition-all duration-300 ${activeTab === 'home' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} />
                <svg className="w-7 h-7 transition-transform group-active:scale-90" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>

              {/* FAVORIS */}
              <Link href="/favorites" className={`flex flex-col items-center gap-1 w-12 transition-all ${activeTab === 'favorites' ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`}>
                <svg className="w-7 h-7 transition-transform active:scale-90" fill={activeTab === 'favorites' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>

              {/* BOUTON CENTRAL PUBLIER */}
              <Link href="/publish" className="relative -top-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-pink-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-500/40 transform transition hover:scale-110 active:scale-95 border-4 border-stone-50 dark:border-gray-900">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </div>
              </Link>

              {/* CARTE */}
              <Link href="/map" className={`flex flex-col items-center gap-1 w-12 transition-all ${activeTab === 'map' ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`}>
                <svg className="w-7 h-7 transition-transform active:scale-90" fill={activeTab === 'map' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.3} viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </Link>

              {/* PROFIL */}
              <Link href="/profile" className={`flex flex-col items-center gap-1 w-12 transition-all ${activeTab === 'profile' ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`}>
                 <svg className="w-7 h-7 transition-transform active:scale-90" fill={activeTab === 'profile' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.3} viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                 </svg>
              </Link>
            </div>
          </div>
        )}
      </body>
    </html>
  )
}
