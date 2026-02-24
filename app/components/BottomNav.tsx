'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Tab = {
  href: string
  label: string
  icon: (active: boolean) => JSX.Element
}

function clsx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(' ')
}

export default function BottomNav() {
  const pathname = usePathname()

  const tabs: Tab[] = [
    {
      href: '/',
      label: 'Accueil',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" />
        </svg>
      ),
    },
    {
      href: '/map',
      label: 'Carte',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5 2V6l5-2 6 2 5-2v16l-5 2-6-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v16M15 6v16" />
        </svg>
      ),
    },
    // ✅ Messages entre Carte et Profil
    {
      href: '/messages',
      label: 'Messages',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.418-4.03 8-9 8a10.2 10.2 0 0 1-3.9-.76L3 20l1.2-3.2C3.43 15.7 3 13.9 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01" />
        </svg>
      ),
    },
    {
      href: '/profile',
      label: 'Profil',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 0 0-16 0" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
        </svg>
      ),
    },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
      <div className="mx-auto max-w-[640px] px-4 py-2 flex items-center justify-around">
        {tabs.map((t) => {
          const active = pathname === t.href
          return (
            <Link
              key={t.href}
              href={t.href}
              className={clsx(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl active:scale-95 transition',
                active ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'
              )}
              aria-current={active ? 'page' : undefined}
            >
              {t.icon(active)}
              <span className="text-[11px] font-medium">{t.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
