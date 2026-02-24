'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const MapView = dynamic(() => import('@/components/Map'), { ssr: false })

export default function MapPage() {
  const supabase = createClientComponentClient()
  const [listings, setListings] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('listings')
        .select('id,title,location_name,lat,lng,images')
        .limit(300)

      setListings(data || [])
    }
    load()
  }, [supabase])

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
      <div className="h-[calc(100vh-160px)] w-full">
        <MapView listings={listings} />
      </div>
    </main>
  )
}
