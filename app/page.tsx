'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import dynamic from 'next/dynamic'
import ListingCard from '@/components/ListingCard'
import FiltersModal from '@/components/FiltersModal'

const Map = dynamic(() => import('@/components/Map'), { 
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Chargement...</div>,
  ssr: false 
})

export default function Home() {
  const supabase = createClientComponentClient()
  const [allListings, setAllListings] = useState<any[]>([]) 
  const [filteredListings, setFilteredListings] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)
  
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
      if (data) {
        const formatted = data.map(item => ({
          id: item.id,
          title: item.title,
          location: item.location_name,
          type: item.type === 'private_room' ? 'Chambre privée' : 'Logement entier',
          raw_type: item.type, // Important pour le filtre
          price_per_week: item.price_per_week,
          bond: item.bond_amount,
          rating: 4.9,
          reviews_count: 0,
          image: item.images?.[0] || '',
          dates: 'Disponible',
          is_superhost: false,
          lat: item.lat,
          lng: item.lng,
          amenities: item.amenities || [],
          women_only: item.women_only // Important pour le filtre
        }))
        setAllListings(formatted)
        setFilteredListings(formatted)
      }
      setLoading(false)
    }
    fetchListings()
  }, [supabase])

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredListings(allListings)
    } else {
      const lowerTerm = searchTerm.toLowerCase()
      const filtered = allListings.filter(l => 
        l.location.toLowerCase().includes(lowerTerm) || 
        l.title.toLowerCase().includes(lowerTerm)
      )
      setFilteredListings(filtered)
    }
    setIsSearchOpen(false) 
  }

  // LOGIQUE DE FILTRAGE AVANCÉE
  const applyFilters = (filters: any) => {
    let result = allListings.filter(l => {
      // Prix
      if (l.price_per_week > filters.maxPrice) return false;
      // Type
      if (filters.type !== 'any' && l.raw_type !== filters.type) return false; 
      // Femmes
      if (filters.womenOnly && !l.women_only) return false;
      // Amenities
      if (filters.amenities.length > 0) {
        const hasAll = filters.amenities.every((a: string) => l.amenities.includes(a));
        if (!hasAll) return false;
      }
      return true;
    });
    setFilteredListings(result);
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 pb-20 transition-colors">
      
      {/* Header Mobile Fixe */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-40 px-4 py-3 shadow-sm flex gap-3 items-center lg:hidden">
         <div 
           onClick={() => setIsSearchOpen(true)}
           className="flex-1 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 flex items-center p-2.5 gap-3 active:scale-95 transition cursor-pointer"
         >
             <svg className="w-5 h-5 text-gray-800 dark:text-white ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {searchTerm ? searchTerm : "Où aller ?"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredListings.length} annonces trouvées
                </span>
             </div>
         </div>
         <button 
           onClick={() => setIsFiltersOpen(true)}
           className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-90 transition bg-white dark:bg-gray-800"
         >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-900 dark:text-white">
               <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
         </button>
      </div>

      {/* MODAL RECHERCHE */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[3000] p-4 animate-in slide-in-from-bottom-10 duration-200">
           <button 
             onClick={() => setIsSearchOpen(false)}
             className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
           >
             ✕
           </button>
           <div className="mt-16 max-w-lg mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Recherche</h2>
              <div className="relative">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Ville, Quartier..."
                  className="w-full p-4 pl-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-lg outline-none focus:ring-2 focus:ring-rose-500 text-gray-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <svg className="w-6 h-6 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <button 
                onClick={handleSearch}
                className="w-full mt-8 bg-rose-500 text-white font-bold py-3.5 rounded-xl text-lg shadow-lg active:scale-95 transition"
              >
                Rechercher
              </button>
           </div>
        </div>
      )}

      {/* MODAL FILTRES CONNECTÉ */}
      <FiltersModal 
        isOpen={isFiltersOpen} 
        onClose={() => setIsFiltersOpen(false)} 
        onApply={applyFilters} 
      />

      {/* Liste et Carte */}
      <div className="flex-1 max-w-[1800px] mx-auto w-full px-4 lg:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_45%] gap-8">
          <div className="pb-20">
            <div className="flex justify-between items-end mb-4 px-1">
               <h2 className="font-semibold text-lg dark:text-white">
                 {loading ? '...' : filteredListings.length > 0 ? `${filteredListings.length} logements` : 'Aucun résultat'}
               </h2>
               {(searchTerm || filteredListings.length !== allListings.length) && (
                 <button onClick={() => { setSearchTerm(''); setFilteredListings(allListings); }} className="text-sm text-rose-500 font-medium underline">
                   Tout effacer
                 </button>
               )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
                {filteredListings.map((listing) => (
                  <ListingCard key={listing.id} data={listing} />
                ))}
              </div>
            )}
          </div>
          <div className="hidden lg:block h-full relative">
             <Map listings={filteredListings} />
          </div>
        </div>
      </div>
    </main>
  )
}
