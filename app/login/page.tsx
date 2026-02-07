'use client'

import dynamic from 'next/dynamic'
import SearchBar from '@/components/SearchBar'
import ListingCard from '@/components/ListingCard'

// Import Dynamique de la carte (ESSENTIEL pour éviter les erreurs Next.js)
const Map = dynamic(() => import('@/components/Map'), { 
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Chargement de la carte...</div>,
  ssr: false 
})

// Fausses données pour visualiser le design Oozly
const MOCK_LISTINGS = [
  {
    id: '1',
    title: 'Chambre spacieuse vue mer',
    location: 'Bondi Beach',
    type: 'Chambre privée',
    price_per_week: 450,
    bond: 1800,
    rating: 4.93,
    reviews_count: 128,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
    lat: -33.8915,
    lng: 151.2767,
    beds: 1,
    dates: 'Disponible le 12 Fév',
    is_superhost: true
  },
  {
    id: '2',
    title: 'Colocation moderne centre-ville',
    location: 'Surry Hills',
    type: 'Chambre partagée',
    price_per_week: 280,
    bond: 1120,
    rating: 4.85,
    reviews_count: 85,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
    lat: -33.8861,
    lng: 151.2111,
    beds: 2,
    dates: 'Immédiat',
    is_superhost: false
  },
  {
    id: '3',
    title: 'Studio calme étudiant',
    location: 'Newtown',
    type: 'Logement entier',
    price_per_week: 550,
    bond: 2200,
    rating: 4.75,
    reviews_count: 42,
    image: 'https://images.unsplash.com/photo-1522771753037-633361652bff?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
    lat: -33.8970,
    lng: 151.1793,
    beds: 1,
    dates: '20-28 Fév',
    is_superhost: true
  },
   {
    id: '4',
    title: 'Maison victorienne rénovée',
    location: 'Paddington',
    type: 'Chambre privée',
    price_per_week: 390,
    bond: 1560,
    rating: 4.98,
    reviews_count: 210,
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
    lat: -33.8828,
    lng: 151.2225,
    beds: 1,
    dates: 'Mars 1',
    is_superhost: true
  }
]

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* 1. HEADER & SEARCH (Fixe) */}
      <div className="border-b border-gray-100 py-5 px-6 sticky top-0 bg-white z-[1000] shadow-sm">
        <div className="max-w-[1800px] mx-auto flex items-center justify-center">
            <SearchBar />
        </div>
      </div>

      {/* 2. CONTENU PRINCIPAL (Grid) */}
      <div className="flex-1 max-w-[1800px] mx-auto w-full px-6 pt-6">
        
        {/* Grille responsive : 1 col sur mobile, 2 cols (Liste/Carte) sur Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_45%] gap-8">
          
          {/* A. COLONNE GAUCHE : LISTE DES LOGEMENTS */}
          <div className="pb-20">
            <div className="flex items-center justify-between mb-6">
               <h2 className="font-semibold text-lg">{MOCK_LISTINGS.length} logements à Sydney</h2>
               <div className="text-sm font-medium text-gray-800 border rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                 Filtres
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                   <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
                 </svg>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
              {MOCK_LISTINGS.map((listing) => (
                <ListingCard key={listing.id} data={listing} />
              ))}
            </div>
          </div>

          {/* B. COLONNE DROITE : CARTE (Sticky) */}
          <div className="hidden lg:block h-full relative">
             <Map listings={MOCK_LISTINGS} />
          </div>
          
        </div>
      </div>
    </main>
  )
}
