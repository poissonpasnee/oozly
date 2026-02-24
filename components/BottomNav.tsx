'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type TabKey = 'home' | 'map' | 'messages' | 'profile'

type Props = {
  /** Optionnel: si tu veux ouvrir la messagerie en modal au lieu d'un /messages */
  onOpenMessages?: () => void
  /** Optionnel: si tu veux forcer l'onglet actif */
  activeTab?: TabKey
}

export default function BottomNav({ onOpenMessages, activeTab }: Props) {
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState<number>(0)

  const currentTab: TabKey = useMemo(() => {
    if (activeTab) return activeTab
    if (pathname?.startsWith('/profile')) return 'profile'
    if (pathname?.startsWith('/messages')) return 'messages'
    if (pathname?.startsWith('/map')) return 'map'
    return 'home'
  }, [activeTab, pathname])

  // 1) Récup user
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (cancelled) return
      setUserId(data.user?.id ?? null)
    })()

    // écoute login/logout
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  // 2) Charger unread + realtime sur conversation_states
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0)
      return
    }

    let mounted = true

    const loadUnread = async () => {
      // Somme des unread_count sur les conversations non archivées
      const { data, error } = await supabase
        .from('conversation_states')
        .select('unread_count')
        .eq('user_id', userId)
        .eq('archived', false)

      if (!mounted) return

      if (error) {
        console.warn('conversation_states unread error:', error)
        setUnreadCount(0)
        return
      }

      const total = (data || []).reduce((acc: number, row: any) => acc + (row.unread_count || 0), 0)
      setUnreadCount(total)
    }

    loadUnread()

    // Realtime
    const channel = supabase
      .channel(`conversation_states_unread_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_states', filter: `user_id=eq.${userId}` },
        () => {
          loadUnread()
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const navItemClass = (key: TabKey) => {
    const isActive = currentTab === key
    return [
      'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition select-none',
      isActive ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300',
      'active:scale-95',
    ].join(' ')
  }

  const iconClass = (key: TabKey) => {
    const isActive = currentTab === key
    return ['w-6 h-6', isActive ? 'stroke-rose-500' : 'stroke-current'].join(' ')
  }

  const MessagesButtonInner = (
    <div className={navItemClass('messages')}>
      <div className="relative">
        <svg className={iconClass('messages')} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
      <span className="text-[11px] font-semibold">Messages</span>
    </div>
  )

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/95 backdrop-blur-md dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-700 px-3 py-2">
        <div className="flex items-center justify-around">
          {/* Accueil */}
          <Link href="/" className={navItemClass('home')} aria-label="Accueil">
            <svg className={iconClass('home')} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h5v-6a1 1 0 011-1h2a1 1 0 011 1v6h5a1 1 0 001-1V10"
              />
            </svg>
            <span className="text-[11px] font-semibold">Accueil</span>
          </Link>

          {/* Carte (si tu n'as pas /map, remplace par la route qui ouvre ta carte) */}
          <Link href="/map" className={navItemClass('map')} aria-label="Carte">
            <svg className={iconClass('map')} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.553-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-1.553-.894L15 9m0 8V9m0 8l-6 3"
              />
            </svg>
            <span className="text-[11px] font-semibold">Carte</span>
          </Link>

          {/* Messages (entre Carte et Profil) */}
          {onOpenMessages ? (
            <button type="button" onClick={onOpenMessages} aria-label="Messages">
              {MessagesButtonInner}
            </button>
          ) : (
            <Link href="/messages" aria-label="Messages">
              {MessagesButtonInner}
            </Link>
          )}

          {/* Profil */}
          <Link href="/profile" className={navItemClass('profile')} aria-label="Profil">
            <svg className={iconClass('profile')} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0"
              />
            </svg>
            <span className="text-[11px] font-semibold">Profil</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
