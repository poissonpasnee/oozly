'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import dynamic from 'next/dynamic'
import ListingCard from '@/components/ListingCard'
import FiltersModal from '@/components/FiltersModal'

const Map = dynamic(() => import('@/components/Map'), { 
  loading: () => <div className="h-full w-full bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center text-gray-400">Chargement...</div>,
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
          raw_type: item.type,
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
          women_only: item.women_only,
          // NOUVEAU : On récupère le tableau des plages de dates
          availability_ranges: item.availability_ranges || [] 
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

  // --- LOGIQUE DE FILTRAGE MISE À JOUR (DATES MULTIPLES) ---
  const applyFilters = (filters: any) => {
    let result = allListings.filter(l => {
      // 1. Prix
      if (l.price_per_week > filters.maxPrice) return false;
      
      // 2. Type
      if (filters.type !== 'any' && l.raw_type !== filters.type) return false; 
      
      // 3. Femmes uniquement
      if (filters.womenOnly && !l.women_only) return false;
      
      // 4. Équipements
      if (filters.amenities.length > 0) {
        const hasAll = filters.amenities.every((a: string) => l.amenities.includes(a));
        if (!hasAll) return false;
      }

      // 5. Disponibilité (Plages de dates multiples)
      const ranges = l.availability_ranges;
      
      // Si l'hôte n'a mis aucune date spécifique, on considère (par défaut) que c'est tout le temps dispo.
      // Si vous préférez l'inverse (indispo par défaut), changez 'return true' par 'return false'.
      if (!ranges || ranges.length === 0) {
         // Logique: Pas de restriction = Disponible
         return true; 
      }

      const today = new Date().toISOString().split('T')[0];

      if (filters.availableNow) {
        // L'utilisateur veut "Maintenant"
        // On cherche SI une des plages contient la date d'aujourd'hui
        const isFreeToday = ranges.some((r: any) => today >= r.start && today <= r.end);
        if (!isFreeToday) return false;
      } 
      else if (filters.targetDate) {
        // L'utilisateur vise une date précise
        // On cherche SI une des plages contient cette date cible
        const isFreeAtDate = ranges.some((r: any) => filters.targetDate >= r.start && filters.targetDate <= r.end);
        if (!isFreeAtDate) return false;
      }

      return true;
    });
    setFilteredListings(result);
  }

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24 transition-colors relative">
      
      {/* HEADER MOBILE */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md dark:bg-gray-900/90 z-40 px-4 py-3 shadow-sm flex gap-3 items-center lg:hidden transition-colors">
         <div onClick={() => setIsSearchOpen(true)} className="flex-1 bg-stone-100 dark:bg-gray-800 rounded-full flex items-center p-3 gap-3 active:scale-95 transition cursor-pointer">
             <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             <span className="text-sm font-semibold text-gray-900 dark:text-white">{searchTerm ? searchTerm : "Où aller ?"}</span>
         </div>
         <button onClick={() => setIsFiltersOpen(true)} className="p-3 border border-stone-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800">
            <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
         </button>
      </div>

      {/* MODAL RECHERCHE */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[3000] p-4 animate-in slide-in-from-bottom-10 duration-200">
           <button onClick={() => setIsSearchOpen(false)} className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">✕</button>
           <div className="mt-16 max-w-lg mx-auto">
              <h2 className="text-2xl font-bold mb-6 dark:text-white">Recherche</h2>
              <input 
                type="text" autoFocus placeholder="Ville, Quartier..."
                className="w-full p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-lg outline-none focus:ring-2 focus:ring-rose-500 text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="w-full mt-8 bg-rose-500 text-white font-bold py-3.5 rounded-xl text-lg">Rechercher</button>
           </div>
        </div>
      )}

      {/* FILTRES */}
      <FiltersModal isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} onApply={applyFilters} />

      {/* LISTE ET CARTE */}
      <div className="flex-1 max-w-[1800px] mx-auto w-full px-4 lg:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_45%] gap-8">
          <div className="pb-20">
            <div className="flex justify-between items-end mb-4 px-1">
               <h2 className="font-semibold text-lg dark:text-white">
                 {loading ? '...' : filteredListings.length > 0 ? `${filteredListings.length} logements` : 'Aucun résultat'}
               </h2>
               {(searchTerm || filteredListings.length !== allListings.length) && (
                 <button onClick={() => { setSearchTerm(''); setFilteredListings(allListings); }} className="text-sm text-rose-500 font-medium underline">Tout effacer</button>
               )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">{[1,2,3,4].map(i => <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>)}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
                {filteredListings.map((listing) => (
                  <ListingCard key={listing.id} data={listing} />
                ))}
              </div>
            )}
          </div>
          <div className="hidden lg:block lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
             <div className="h-full w-full lg:rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700 relative z-0">
                 <Map listings={filteredListings} />
             </div>
          </div>
        </div>
      </div>
    </main>
  )
}
