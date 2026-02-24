'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function BottomNav() {
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const loadUnread = async () => {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user?.id
      if (!uid) return

      const { data: states } = await supabase
        .from('conversation_states')
        .select('unread_count')
        .eq('user_id', uid)

      const total = (states || []).reduce((acc: number, s: any) => acc + (s.unread_count || 0), 0)
      setUnread(total)
    }

    loadUnread()
  }, [supabase])

  const active = (path: string) =>
    pathname?.startsWith(path) ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[3000]">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-3 py-2">
        <div className="grid grid-cols-5 items-center max-w-[900px] mx-auto">

          <Link href="/" className={`flex flex-col items-center ${active('/')}`}>
            🏠
            <span className="text-[11px]">Accueil</span>
          </Link>

          <Link href="/map" className={`flex flex-col items-center ${active('/map')}`}>
            🗺️
            <span className="text-[11px]">Carte</span>
          </Link>

          <Link href="/publish" className="flex justify-center">
            <div className="w-14 h-14 -mt-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-2xl shadow-lg">
              +
            </div>
          </Link>

          <Link href="/messages" className={`flex flex-col items-center relative ${active('/messages')}`}>
            💬
            {unread > 0 && (
              <span className="absolute -top-1 right-2 bg-red-500 text-white text-[10px] px-1 rounded-full">
                {unread}
              </span>
            )}
            <span className="text-[11px]">Messages</span>
          </Link>

          <Link href="/profile" className={`flex flex-col items-center ${active('/profile')}`}>
            👤
            <span className="text-[11px]">Profil</span>
          </Link>

        </div>
      </div>
    </nav>
  )
}
