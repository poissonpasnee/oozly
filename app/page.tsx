'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import dynamic from 'next/dynamic'
import SearchBar from '@/components/SearchBar'
import ListingCard from '@/components/ListingCard'

// Import de la carte (toujours en dynamique)
const Map = dynamic(() => import('@/components/Map'), { 
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Chargement de la carte...</div>,
  ssr: false 
})

export default function Home() {
  const supabase = createClientComponentClient()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Récupération des données Supabase au chargement
  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur chargement:', error)
      } else {
        // Transformation des données pour correspondre à notre composant ListingCard
        const formattedData = data?.map(item => ({
          id: item.id,
          title: item.title,
          location: item.location_name, // Nom de la colonne dans la BDD
          type: item.type === 'private_room' ? 'Chambre privée' : 'Logement entier',
          price_per_week: item.price_per_week,
          bond: item.bond_amount,
          rating: 4.9, // Valeur par défaut car pas encore de système d'avis
          reviews_count: 0,
          image: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/400', // Prend la 1ère image
          lat: item.lat,
          lng: item.lng,
          dates: 'Disponible',
          is_superhost: false
        })) || []
        
        setListings(formattedData)
      }
      setLoading(false)
    }

    fetchListings()
  }, [supabase])

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* 1. HEADER & SEARCH */}
      <div className="border-b border-gray-100 py-5 px-6 sticky top-0 bg-white z-[1000] shadow-sm">
        <div className="max-w-[1800px] mx-auto flex items-center justify-center">
            <SearchBar />
        </div>
      </div>

      {/* 2. CONTENU */}
      <div className="flex-1 max-w-[1800px] mx-auto w-full px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_45%] gap-8">
          
          {/* A. LISTE */}
          <div className="pb-20">
            <div className="flex items-center justify-between mb-6">
               <h2 className="font-semibold text-lg">
                 {loading ? 'Chargement...' : `${listings.length} logements à Sydney`}
               </h2>
               <button 
                 onClick={() => setIsFiltersOpen(true)} // Note: Il faudra réimporter le Modal plus tard si besoin
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
