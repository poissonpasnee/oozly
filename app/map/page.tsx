'use client'
import dynamic from 'next/dynamic'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

export default function MapPage() {
  const supabase = createClientComponentClient()
  const [listings, setListings] = useState<any[]>([])

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('listings').select('*')
      if (data) setListings(data)
    }
    fetch()
  }, [])

  return (
    <div className="h-[calc(100vh-80px)] w-full">
      <Map listings={listings} />
    </div>
  )
}
