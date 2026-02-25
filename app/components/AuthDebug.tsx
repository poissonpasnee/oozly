'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseBrowser'

export default function AuthDebug() {
  const [uid, setUid] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUid(data.session?.user?.id ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUid(session?.user?.id ?? null)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  if (!uid) return null
  return (
    <div className="fixed top-2 left-2 z-50 text-[11px] px-2 py-1 rounded bg-black/60 text-white">
      UID: {uid.slice(0, 8)}…
    </div>
  )
}
