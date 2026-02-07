// app/page.tsx
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import SearchBar from '@/components/SearchBar'
import ListingCard from '@/components/ListingCard'
import FiltersModal from '@/components/FiltersModal'

// Import Dynamique de la carte (ESSENTIEL pour éviter les erreurs Next.js lors du Server Side Rendering)
const Map = dynamic(() => import('@/components/Map'), { 
  loading: () => (
    <div className="h-full w-full bg-gray-50 animate-pulse rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2 border border-gray-100">
      <svg className="w-10 h-10 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
      <span className="text-sm font-medium">Chargement de la carte...</span>
    </div>
  ),
  ssr: false 
})

// Fausses données pour visualiser le design Oozly (Prix par semaine + Caution)
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
  // État pour gérer l'ouverture/fermeture du modal Filtres
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
      
      {/* --- 1. COMPOSANT MODAL FILTRES --- */}
      <FiltersModal 
        isOpen={isFiltersOpen} 
        onClose={() => setIsFiltersOpen(false)} 
      />

      {/* --- 2. HEADER & SEARCH (Sticky) --- */}
      <div className="border-b border-gray-100 py-5 px-6 sticky top-0 bg-white z-[1000] shadow-sm transition-shadow">
        <div className="max-w-[1800px] mx-auto flex items-center justify-center relative">
            
            {/* Logo Oozly (Simulé texte) - Tu pourras mettre une image ici plus tard */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden xl:block font-bold text-rose-500 text-2xl tracking-tighter">
              oozly
            </div>

            <SearchBar />
            
            {/* Menu Utilisateur (Simulé) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 border border-gray-200 rounded-full p-1 pl-3 hover:shadow-md transition cursor-pointer bg-white">
               <div className="text-sm font-medium pr-1">Menu</div>
               <div className="h-8 w-8 bg-gray-500 rounded-full text-white flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A9.948 9.948 0 0010 18a9.963 9.963 0 004.793-1.61A5.99 5.99 0 0010 12z" clipRule="evenodd" />
                 </svg>
               </div>
            </div>
        </div>
      </div>

      {/* --- 3. CONTENU PRINCIPAL (Grid Responsive) --- */}
      <div className="flex-1 max-w-[1800px] mx-auto w-full px-4 sm:px-8 pt-6">
        
        {/* Layout : 1 colonne sur mobile, 2 colonnes (60/40) sur Desktop large */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_45%] xl:grid-cols-[1fr_40%] gap-8 items-start">
          
          {/* A. COLONNE GAUCHE : LISTE DES LOGEMENTS */}
          <div className="pb-20">
            
            {/* Barre d'outils (Titre + Bouton Filtres) */}
            <div className="flex items-center justify-between mb-6 sticky top-28 bg-white/95 backdrop-blur z-10 py-2">
               <h2 className="font-semibold text-lg text-gray-900">{MOCK_LISTINGS.length} logements à Sydney</h2>
               
               {/* Bouton qui déclenche le Modal */}
               <button 
                 onClick={() => setIsFiltersOpen(true)}
                 className="text-sm font-medium text-gray-800 border border-gray-300 rounded-xl px-4 py-2 cursor-pointer hover:border-black hover:bg-gray-50 transition-colors flex items-center gap-2 group"
               >
                 <span className="group-hover:scale-105 transition-transform">Filtres</span>
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                   <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
                 </svg>
               </button>
            </div>

            {/* Grille des cartes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-10">
              {MOCK_LISTINGS.map((listing) => (
                <ListingCard key={listing.id} data={listing} />
              ))}
            </div>
          </div>

          {/* B. COLONNE DROITE : CARTE (Sticky & Hidden on Mobile) */}
          <div className="hidden lg:block h-[calc(100vh-140px)] sticky top-28 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
             <Map listings={MOCK_LISTINGS} />
          </div>
          
        </div>
      </div>
    </main>
  )
}
