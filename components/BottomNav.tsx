'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function BottomNav() {
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const [unread, setUnread] = useState(0)

  const active = useMemo(() => {
    return {
      home: pathname === '/',
      map: pathname?.startsWith('/map'),
      messages: pathname?.startsWith('/messages'),
      profile: pathname?.startsWith('/profile'),
      publish: pathname?.startsWith('/publish'),
    }
  }, [pathname])

  useEffect(() => {
    let mounted = true

    const loadUnread = async () => {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user?.id
      if (!uid) {
        if (!mounted) return
        setUnread(0)
        return
      }

      const { data: states, error } = await supabase
        .from('conversation_states')
        .select('unread_count')
        .eq('user_id', uid)

      if (error) {
        console.warn('unread badge error:', error)
        if (!mounted) return
        setUnread(0)
        return
      }

      const total = (states || []).reduce((acc: number, r: any) => acc + (Number(r.unread_count) || 0), 0)
      if (!mounted) return
      setUnread(total)
    }

    loadUnread()

    const channel = supabase
      .channel('rt-unread-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadUnread)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_states' }, loadUnread)
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const itemClass = (isOn: boolean) =>
    cn(
      'flex flex-col items-center justify-center py-1.5 rounded-xl active:scale-95 transition select-none',
      isOn ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'
    )

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[5000]">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-3 py-2">
        <div className="grid grid-cols-5 items-center max-w-[900px] mx-auto">
          {/* Accueil */}
          <Link href="/" className={itemClass(active.home)} aria-label="Accueil">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10" />
            </svg>
            <span className="text-[11px] mt-1 font-semibold">Accueil</span>
          </Link>

          {/* Carte */}
          <Link href="/map" className={itemClass(active.map)} aria-label="Carte">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 20l-5-2V6l5 2 6-2 5 2v12l-5-2-6 2Z" />
              <path d="M9 20V8" />
              <path d="M15 18V6" />
            </svg>
            <span className="text-[11px] mt-1 font-semibold">Carte</span>
          </Link>

          {/* + Publier (IMPORTANT: /publish) */}
          <Link href="/publish" className="flex items-center justify-center" aria-label="Publier">
            <div className="w-14 h-14 -mt-7 rounded-full bg-rose-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </div>
          </Link>

          {/* Messages + badge */}
          <Link href="/messages" className={cn(itemClass(active.messages), 'relative')} aria-label="Messages">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12c0 4.4-4 8-9 8a10 10 0 0 1-4.3-.9L3 20l1.4-3.7A7.6 7.6 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z" />
              <path d="M8 12h.01" />
              <path d="M12 12h.01" />
              <path d="M16 12h.01" />
            </svg>
            <span className="text-[11px] mt-1 font-semibold">Messages</span>

            {unread > 0 && (
              <span className="absolute top-1 right-4 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>

          {/* Profil */}
          <Link href="/profile" className={itemClass(active.profile)} aria-label="Profil">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21a8 8 0 1 0-16 0" />
              <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
            </svg>
            <span className="text-[11px] mt-1 font-semibold">Profil</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
