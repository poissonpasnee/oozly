'use client'

import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'

// Import de la carte Leaflet (sans SSR)
const MiniMap = dynamic(() => import('@/components/Map'), { 
  loading: () => <div className="h-64 w-full bg-gray-100 rounded-xl animate-pulse"></div>,
  ssr: false 
})

// Mock Data pour la démo (Simule une requête BDD Supabase)
const MOCK_DATA = {
  id: '1',
  title: 'Chambre spacieuse vue mer à Bondi',
  location: 'Bondi Beach, Sydney',
  price_per_week: 450,
  bond: 1800,
  description: "Superbe chambre dans un appartement partagé à 5 min de la plage. L'ambiance est détendue, nous cherchons quelqu'un de propre et respectueux. Idéal pour surfeur ou étudiant.",
  amenities: ['Wifi', 'Lave-linge', 'Balcon', 'Cuisine équipée', 'Planche de surf dispo'],
  rules: {
    couples_accepted: false,
    pets_allowed: false,
    min_stay: '3 mois'
  },
  host: {
    name: 'Sarah',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    response_rate: '100%'
  },
  images: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
    'https://images.unsplash.com/photo-1522771753037-633361652bff?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80'
  ],
  lat: -33.8915,
  lng: 151.2767
}

export default function RoomPage() {
  const params = useParams()
  const [showChat, setShowChat] = useState(false)

  // Dans la vraie vie : const { data } = await supabase.from('listings').select('*').eq('id', params.id)
  const room = MOCK_DATA 

  return (
    <div className="bg-white min-h-screen pb-20">
      
      {/* 1. Header Navigation Simple */}
      <div className="border-b border-gray-100 py-4 px-6 sticky top-0 bg-white z-50 flex items-center justify-between">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div className="flex gap-2">
           <button className="p-2 hover:bg-gray-100 rounded-full flex gap-2 text-sm font-semibold underline">Partager</button>
           <button className="p-2 hover:bg-gray-100 rounded-full flex gap-2 text-sm font-semibold underline">Enregistrer</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        
        {/* 2. Titre & Photos */}
        <h1 className="text-2xl font-bold mb-4">{room.title}</h1>
        
        {/* Galerie Grid (1 grande image + 2 petites) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-8 relative">
          <div className="h-full relative">
             <img src={room.images[0]} className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer" />
          </div>
          <div className="hidden md:grid grid-rows-2 gap-2 h-full">
             <img src={room.images[1]} className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer" />
             <img src={room.images[2]} className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer" />
          </div>
          <button className="absolute bottom-4 right-4 bg-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md border border-gray-900">
             Voir toutes les photos
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_35%] gap-12">
          
          {/* 3. Colonne GAUCHE (Infos) */}
          <div className="space-y-8">
            <div className="flex justify-between items-start border-b border-gray-100 pb-6">
               <div>
                 <h2 className="text-xl font-bold mb-1">{room.location}</h2>
                 <p className="text-gray-500">Chambre privée dans : Appartement</p>
               </div>
               <div className="text-center">
                 <img src={room.host.avatar} className="w-14 h-14 rounded-full object-cover mb-1 mx-auto" />
                 <p className="text-xs text-gray-500">Hôte : {room.host.name}</p>
               </div>
            </div>

            {/* Description */}
            <div className="border-b border-gray-100 pb-6">
               <h3 className="font-semibold text-lg mb-3">À propos de ce logement</h3>
               <p className="text-gray-600 leading-relaxed">{room.description}</p>
            </div>

            {/* Équipements */}
            <div className="border-b border-gray-100 pb-6">
               <h3 className="font-semibold text-lg mb-4">Ce que propose ce logement</h3>
               <div className="grid grid-cols-2 gap-4">
                 {room.amenities.map(am => (
                   <div key={am} className="flex items-center gap-3 text-gray-700">
                     <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     {am}
                   </div>
                 ))}
               </div>
            </div>

            {/* Règles Oozly */}
            <div className="border-b border-gray-100 pb-6">
               <h3 className="font-semibold text-lg mb-4">Règles de la coloc</h3>
               <ul className="space-y-3">
                 <li className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Couples acceptés ?</span>
                    <span className={`font-bold ${room.rules.couples_accepted ? 'text-green-600' : 'text-red-500'}`}>
                      {room.rules.couples_accepted ? 'Oui' : 'Non'}
                    </span>
                 </li>
                 <li className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Durée minimum</span>
                    <span className="font-bold text-gray-900">{room.rules.min_stay}</span>
                 </li>
               </ul>
            </div>
            
            {/* Localisation (Mini Map) */}
            <div>
               <h3 className="font-semibold text-lg mb-4">Où vous habiterez</h3>
               <div className="h-[300px] w-full rounded-xl overflow-hidden border border-gray-200">
                  {/* On réutilise la carte mais juste avec 1 marqueur */}
                  <MiniMap listings={[room]} />
               </div>
               <p className="mt-2 text-sm text-gray-500">Bondi Beach, New South Wales, Australie</p>
            </div>
          </div>

          {/* 4. Colonne DROITE (Carte de Réservation Flottante) */}
          <div className="relative">
             <div className="sticky top-32 border border-gray-200 shadow-xl rounded-xl p-6 bg-white">
                
                <div className="flex justify-between items-end mb-6">
                   <div>
                     <span className="text-2xl font-bold">${room.price_per_week}</span>
                     <span className="text-gray-500"> / semaine</span>
                   </div>
                   <div className="text-xs text-gray-500 underline cursor-pointer">
                      Caution: ${room.bond}
                   </div>
                </div>

                <div className="border border-gray-300 rounded-lg mb-4 overflow-hidden">
                   <div className="grid grid-cols-2 border-b border-gray-300">
                      <div className="p-3 border-r border-gray-300">
                         <div className="text-[10px] font-bold uppercase text-gray-800">Arrivée</div>
                         <div className="text-sm text-gray-600">Ajouter une date</div>
                      </div>
                      <div className="p-3">
                         <div className="text-[10px] font-bold uppercase text-gray-800">Durée</div>
                         <div className="text-sm text-gray-600">Flexible</div>
                      </div>
                   </div>
                   <div className="p-3">
                      <div className="text-[10px] font-bold uppercase text-gray-800">Voyageurs</div>
                      <div className="text-sm text-gray-600">1 voyageur</div>
                   </div>
                </div>

                {/* BOUTON D'ACTION PRINCIPAL : CHAT */}
                <button 
                  onClick={() => alert("Ouvre la fenêtre de chat Supabase (à venir)")}
                  className="w-full bg-[#FF385C] hover:bg-[#d93250] text-white font-bold py-3.5 rounded-lg text-lg mb-4 transition"
                >
                  Discuter avec l'hôte
                </button>
                
                <p className="text-center text-xs text-gray-500 mb-4">Aucun montant débité pour le moment</p>
                
                <div className="flex justify-between text-gray-600 py-1">
                   <span className="underline">Loyer x 4 semaines</span>
                   <span>${room.price_per_week * 4}</span>
                </div>
                <div className="flex justify-between text-gray-600 py-1 font-semibold text-rose-500">
                   <span className="underline">Caution (Bond)</span>
                   <span>${room.bond}</span>
                </div>
                
                <hr className="my-4" />
                
                <div className="flex justify-between font-bold text-lg text-gray-900">
                   <span>Total 1er mois</span>
                   <span>${(room.price_per_week * 4) + room.bond}</span>
                </div>

             </div>
          </div>

        </div>
      </div>
    </div>
  )
}
