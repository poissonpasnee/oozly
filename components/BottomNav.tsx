'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type UnreadState = {
  unread: number
  loading: boolean
}

export default function BottomNav() {
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const [unreadState, setUnreadState] = useState<UnreadState>({ unread: 0, loading: true })

  const isActive = useMemo(() => {
    return {
      home: pathname === '/',
      map: pathname === '/map' || pathname === '/' /* tu utilises la carte sur / */,
      messages: pathname?.startsWith('/messages'),
      profile: pathname?.startsWith('/profile') || pathname?.startsWith('/account'),
      create: pathname?.startsWith('/publish') || pathname?.startsWith('/create'),
    }
  }, [pathname])

  useEffect(() => {
    let mounted = true

    const loadUnread = async () => {
      setUnreadState((s) => ({ ...s, loading: true }))
      const { data: sessionRes } = await supabase.auth.getSession()
      const userId = sessionRes.session?.user?.id
      if (!userId) {
        if (!mounted) return
        setUnreadState({ unread: 0, loading: false })
        return
      }

      /**
       * ✅ IMPORTANT
       * Tu as déjà des tables: conversations / messages / conversation_states.
       * Le plus robuste est d’utiliser conversation_states (si elle contient un compteur),
       * sinon on calcule via last_read_at.
       *
       * Ici, on tente d’abord unread_count, puis fallback sur calcul.
       */
      // 1) tentative: somme unread_count
      const { data: states, error: statesErr } = await supabase
        .from('conversation_states')
        .select('unread_count')
        .eq('user_id', userId)

      if (!statesErr && states && states.length > 0 && typeof states[0]?.unread_count !== 'undefined') {
        const total = states.reduce((acc: number, s: any) => acc + (Number(s.unread_count) || 0), 0)
        if (!mounted) return
        setUnreadState({ unread: total, loading: false })
        return
      }

      // 2) fallback: calcul (messages.created_at > last_read_at)
      const { data: states2 } = await supabase
        .from('conversation_states')
        .select('conversation_id,last_read_at')
        .eq('user_id', userId)

      if (!states2 || states2.length === 0) {
        if (!mounted) return
        setUnreadState({ unread: 0, loading: false })
        return
      }

      const convoIds = states2.map((s: any) => s.conversation_id).filter(Boolean)
      if (convoIds.length === 0) {
        if (!mounted) return
        setUnreadState({ unread: 0, loading: false })
        return
      }

      // On récupère les messages récents et on compte > last_read_at (simplifié)
      // ⚠️ Si ta table messages est grosse, limite avec un index et/ou une RPC plus tard.
      const { data: msgs } = await supabase
        .from('messages')
        .select('conversation_id,created_at,sender_id')
        .in('conversation_id', convoIds)

      const byConvo = new Map<string, { lastRead: string | null; unread: number }>()
      for (const s of states2) byConvo.set(s.conversation_id, { lastRead: s.last_read_at || null, unread: 0 })

      const nowUnreadByConvo = new Map<string, number>()
      const me = userId

      for (const m of msgs || []) {
        if (!m?.conversation_id) continue
        if (m.sender_id === me) continue
        const st = byConvo.get(m.conversation_id)
        const lastRead = st?.lastRead
        if (!lastRead) {
          nowUnreadByConvo.set(m.conversation_id, (nowUnreadByConvo.get(m.conversation_id) || 0) + 1)
          continue
        }
        if (new Date(m.created_at).getTime() > new Date(lastRead).getTime()) {
          nowUnreadByConvo.set(m.conversation_id, (nowUnreadByConvo.get(m.conversation_id) || 0) + 1)
        }
      }

      let total = 0
      for (const v of nowUnreadByConvo.values()) total += v

      if (!mounted) return
      setUnreadState({ unread: total, loading: false })
    }

    loadUnread()

    // Realtime: si un message arrive, on recharge le badge
    const channel = supabase
      .channel('bottomnav-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadUnread())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_states' }, () => loadUnread())
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[2000]">
      <div className="mx-auto max-w-[900px]">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-3 py-2">
          <div className="grid grid-cols-5 items-center">
            {/* Accueil */}
            <Link
              href="/"
              className={cn(
                'flex flex-col items-center justify-center py-1.5 rounded-xl active:scale-95 transition',
                isActive.home ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'
              )}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10" />
              </svg>
              <span className="text-[11px] mt-1 font-semibold">Accueil</span>
            </Link>

            {/* Carte (si ta carte est sur /, ce tab = /) */}
            <Link
              href="/"
              className={cn(
                'flex flex-col items-center justify-center py-1.5 rounded-xl active:scale-95 transition',
                isActive.map ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'
              )}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 20l-5-2V6l5 2 6-2 5 2v12l-5-2-6 2Z" />
                <path d="M9 20V8" />
                <path d="M15 18V6" />
              </svg>
              <span className="text-[11px] mt-1 font-semibold">Carte</span>
            </Link>

            {/* PLUS - Créer annonce (réapparition) */}
            <Link href="/publish" className="flex items-center justify-center">
              <div className="w-14 h-14 -mt-7 rounded-full bg-rose-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </div>
            </Link>

            {/* Messages + badge */}
            <Link
              href="/messages"
              className={cn(
                'relative flex flex-col items-center justify-center py-1.5 rounded-xl active:scale-95 transition',
                isActive.messages ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'
              )}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12c0 4.4-4 8-9 8a10 10 0 0 1-4.3-.9L3 20l1.4-3.7A7.6 7.6 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z" />
                <path d="M8 12h.01" />
                <path d="M12 12h.01" />
                <path d="M16 12h.01" />
              </svg>
              <span className="text-[11px] mt-1 font-semibold">Messages</span>

              {!unreadState.loading && unreadState.unread > 0 && (
                <span className="absolute top-1 right-4 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {unreadState.unread > 99 ? '99+' : unreadState.unread}
                </span>
              )}
            </Link>

            {/* Profil */}
            <Link
              href="/profile"
              className={cn(
                'flex flex-col items-center justify-center py-1.5 rounded-xl active:scale-95 transition',
                isActive.profile ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'
              )}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21a8 8 0 1 0-16 0" />
                <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
              </svg>
              <span className="text-[11px] mt-1 font-semibold">Profil</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
