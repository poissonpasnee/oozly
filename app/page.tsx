'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import dynamic from 'next/dynamic'
import SearchBar from '@/components/SearchBar'
import ListingCard from '@/components/ListingCard'
import FiltersModal from '@/components/FiltersModal'

const Map = dynamic(() => import('@/components/Map'), { 
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Chargement de la carte...</div>,
  ssr: false 
})

export default function Home() {
  const supabase = createClientComponentClient()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) {
        const formattedData = data.map(item => ({
          id: item.id,
          title: item.title,
          location: item.location_name,
          type: item.type === 'private_room' ? 'Chambre privée' : 'Logement entier',
          price_per_week: item.price_per_week,
          bond: item.bond_amount,
          rating: 4.9,
          reviews_count: 0,
          image: item.images && item.images.length > 0 ? item.images[0] : '',
          lat: item.lat,
          lng: item.lng,
          dates: 'Disponible',
          is_superhost: false
        }))
        setListings(formattedData)
      }
      setLoading(false)
    }

    fetchListings()
  }, [supabase])

  return (
    <main className="min-h-screen bg-white pb-20">
      
      {/* 1. Header Mobile Fixe */}
      <div className="sticky top-0 bg-white z-40 px-4 py-3 shadow-sm flex gap-3 items-center lg:hidden">
         <div className="flex-1 bg-white rounded-full shadow-md border border-gray-200 flex items-center p-2.5 gap-3 active:scale-95 transition">
             <svg className="w-5 h-5 text-gray-800 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             <div className="flex flex-col">
                <span className="text-sm font-semibold">Où aller ?</span>
                <span className="text-xs text-gray-500">N'importe où • Une semaine</span>
             </div>
         </div>
         <button 
           onClick={() => setIsFiltersOpen(true)}
           className="p-2.5 border border-gray-200 rounded-full hover:bg-gray-50 active:scale-90 transition"
         >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-900">
               <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
         </button>
      </div>

      {/* 2. Header Desktop (Caché sur mobile) */}
      <div className="hidden lg:block border-b border-gray-100 py-5 px-6 sticky top-0 bg-white z-50 shadow-sm">
        <div className="max-w-[1800px] mx-auto flex items-center justify-center">
            <SearchBar />
        </div>
      </div>

      <FiltersModal isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} />

      {/* 3. Contenu */}
      <div className="flex-1 max-w-[1800px] mx-auto w-full px-4 lg:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_45%] gap-8">
          
          {/* A. LISTE */}
          <div className="pb-20">
            <div className="hidden lg:flex items-center justify-between mb-6">
               <h2 className="font-semibold text-lg">
                 {loading ? 'Chargement...' : `${listings.length} logements à Sydney`}
               </h2>
               <button 
                 onClick={() => setIsFiltersOpen(true)}
                 className="text-sm font-medium text-gray-800 border rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center gap-2"
               >
                 Filtres
               </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse"></div>)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} data={listing} />
                ))}
              </div>
            )}
          </div>

          {/* B. CARTE */}
          <div className="hidden lg:block h-full relative">
             <Map listings={listings} />
          </div>
          
        </div>
      </div>
    </main>
  )
}
