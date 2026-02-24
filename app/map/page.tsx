'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const MapView = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] w-full bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center text-gray-400">
      Chargement…
    </div>
  ),
})

export default function MapPage() {
  const supabase = createClientComponentClient()
  const [listings, setListings] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
      setListings(data ?? [])
    })()
  }, [supabase])

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <h1 className="text-xl font-bold dark:text-white mb-4">Carte</h1>
        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <MapView listings={listings} />
        </div>
      </div>
    </main>
  )
}
