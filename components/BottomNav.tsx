'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function BottomNav() {
  const pathname = usePathname()

  // Pages où on cache la barre (ex: login)
  const hideOn = new Set<string>(['/login'])
  if (hideOn.has(pathname)) return null

  const isActive = (href: string) => {
    // active exact ou sous-route
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
      <div className="max-w-[1100px] mx-auto px-3 py-2 flex items-center justify-between">
        {/* Accueil */}
        <Link
          href="/"
          className={cn(
            'flex flex-col items-center gap-1 px-3 py-2 rounded-xl',
            isActive('/') ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'
          )}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5l9-7 9 7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
          </svg>
          <span className="text-[11px] font-semibold">Accueil</span>
        </Link>

        {/* Carte */}
        <Link
          href="/#map"
          className={cn(
            'flex flex-col items-center gap-1 px-3 py-2 rounded-xl',
            pathname === '/' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'
          )}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5 2V6l5-2 6 2 5-2v16l-5 2-6-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v16" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6v16" />
          </svg>
          <span className="text-[11px] font-semibold">Carte</span>
        </Link>

        {/* Publier (bouton central) */}
        <Link
          href="/publish"
          className="relative -mt-6 flex flex-col items-center"
          aria-label="Publier"
        >
          <div className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-500/30 border-4 border-white dark:border-gray-900">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <span className="text-[11px] font-extrabold text-rose-500 mt-1">Publier</span>
        </Link>

        {/* Messages */}
        <Link
          href="/messages"
          className={cn(
            'flex flex-col items-center gap-1 px-3 py-2 rounded-xl',
            isActive('/messages') ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'
          )}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h8M8 14h5m8-2c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="text-[11px] font-semibold">Messages</span>
        </Link>

        {/* Profil */}
        <Link
          href="/profile"
          className={cn(
            'flex flex-col items-center gap-1 px-3 py-2 rounded-xl',
            isActive('/profile') ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'
          )}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a8.25 8.25 0 0115 0" />
          </svg>
          <span className="text-[11px] font-semibold">Profil</span>
        </Link>
      </div>
    </nav>
  )
}