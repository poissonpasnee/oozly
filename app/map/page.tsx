'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const MapView = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-200px)] w-full bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center text-gray-400">
      Chargement carte…
    </div>
  ),
})

export default function MapPage() {
  const supabase = createClientComponentClient()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('listings')
        .select('id,title,location_name,type,price_per_week,images,lat,lng,host_id,created_at')
        .order('created_at', { ascending: false })
        .limit(300)

      if (error) {
        console.warn('map listings error:', error)
        setListings([])
        setLoading(false)
        return
      }

      setListings(
        (data || []).map((x: any) => ({
          id: x.id,
          title: x.title,
          location_name: x.location_name,
          location: x.location_name,
          type: x.type,
          raw_type: x.type,
          price_per_week: x.price_per_week,
          image: x.images?.[0] || '',
          lat: x.lat,
          lng: x.lng,
          host_id: x.host_id,
          created_at: x.created_at,
        }))
      )
      setLoading(false)
    }

    run()
  }, [supabase])

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
      <div className="max-w-[1800px] mx-auto w-full px-4 lg:px-6 pt-4">
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white mb-3">Carte</h1>

        <div className="h-[calc(100vh-220px)] w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          {loading ? (
            <div className="h-full w-full bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center text-gray-400">
              Chargement…
            </div>
          ) : (
            <MapView listings={listings} />
          )}
        </div>
      </div>
    </main>
  )
}
