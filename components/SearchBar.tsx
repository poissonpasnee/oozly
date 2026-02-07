// components/SearchBar.tsx
'use client'

import { useState } from 'react'

export default function SearchBar() {
  // États pour gérer l'ouverture des menus
  const [activeTab, setActiveTab] = useState<'location' | 'date' | 'who' | null>(null)
  
  // États des données
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [guests, setGuests] = useState({
    adults: 0,
    couples: 0, // Ton option "Autre" spécifique pour la colocation
    pets: 0
  })

  // Fonction pour gérer les compteurs (+ / -)
  const updateGuests = (type: keyof typeof guests, operation: 'add' | 'remove') => {
    setGuests(prev => {
      const newValue = operation === 'add' ? prev[type] + 1 : prev[type] - 1
      return { ...prev, [type]: Math.max(0, newValue) }
    })
  }

  // Calcul du résumé pour l'affichage (ex: "2 Voyageurs")
  const totalGuests = guests.adults + (guests.couples * 2)
  const guestLabel = totalGuests > 0 
    ? `${totalGuests} voyageur${totalGuests > 1 ? 's' : ''}` 
    : 'Ajouter des voyageurs'

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* --- LA BARRE PRINCIPALE --- */}
      <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200 h-16 relative z-50">
        
        {/* 1. SECTION OÙ (Location) */}
        <div 
          onClick={() => setActiveTab('location')}
          className={`flex-1 relative pl-8 pr-4 py-3 rounded-full cursor-pointer hover:bg-gray-100 ${activeTab === 'location' ? 'bg-white shadow-lg' : ''}`}
        >
          <div className="text-xs font-bold text-gray-800">Où ?</div>
          <input 
            type="text"
            placeholder="Rechercher une ville"
            className="w-full bg-transparent border-none text-sm text-gray-600 placeholder-gray-400 focus:outline-none truncate"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="h-8 w-[1px] bg-gray-200"></div>

        {/* 2. SECTION QUAND (Date) */}
        <div 
          onClick={() => setActiveTab('date')}
          className="flex-1 relative px-6 py-3 cursor-pointer hover:bg-gray-100 rounded-full"
        >
          <div className="text-xs font-bold text-gray-800">Quand ?</div>
          <div className="text-sm text-gray-400 truncate">
             {date ? date : "Date d'emménagement"}
          </div>
        </div>

        <div className="h-8 w-[1px] bg-gray-200"></div>

        {/* 3. SECTION QUI (Voyageurs) */}
        <div 
          onClick={() => setActiveTab(activeTab === 'who' ? null : 'who')}
          className="flex-[1.2] pl-6 pr-2 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-100 rounded-full relative"
        >
          <div className="flex flex-col">
            <div className="text-xs font-bold text-gray-800">Qui ?</div>
            <div className={`text-sm truncate ${totalGuests > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {guestLabel}
            </div>
          </div>

          {/* BOUTON RECHERCHER (Rose) */}
          <button className="bg-[#FF385C] hover:bg-[#d93250] text-white p-3 rounded-full flex items-center justify-center transition-colors shadow-md ml-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 font-bold">
              <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
            </svg>
            <span className="ml-2 font-medium hidden lg:block pr-1">Rechercher</span>
          </button>
        </div>
      </div>

      {/* --- LES MODALS DÉROULANTS (Popups) --- */}
      
      {/* Popup OÙ (Suggestions) */}
      {activeTab === 'location' && (
        <div className="absolute top-20 left-0 w-[350px] bg-white rounded-3xl shadow-2xl p-6 z-40 border border-gray-100">
           <div className="space-y-4">
             <div className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Autour de moi</span>
             </div>
             <div className="text-xs text-gray-400 uppercase font-bold tracking-wider pt-2">Villes Populaires</div>
             <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">Sydney, Australie</div>
             <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">Melbourne, Australie</div>
           </div>
        </div>
      )}

      {/* Popup QUI (Compteurs) */}
      {activeTab === 'who' && (
        <div className="absolute top-20 right-0 w-[350px] bg-white rounded-3xl shadow-2xl p-6 z-40 border border-gray-100">
          
          {/* Ligne Adultes */}
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <div>
              <div className="font-semibold text-gray-900">Adultes</div>
              <div className="text-sm text-gray-500">13 ans et plus</div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => updateGuests('adults', 'remove')}
                disabled={guests.adults === 0}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-800 disabled:opacity-30"
              >-</button>
              <span className="w-4 text-center">{guests.adults}</span>
              <button 
                onClick={() => updateGuests('adults', 'add')}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-800"
              >+</button>
            </div>
          </div>

          {/* Ligne Couples (Ton ajout Spécial) */}
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <div>
              <div className="font-semibold text-gray-900">Couples</div>
              <div className="text-sm text-gray-500">Partageant 1 chambre</div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => updateGuests('couples', 'remove')}
                disabled={guests.couples === 0}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-800 disabled:opacity-30"
              >-</button>
              <span className="w-4 text-center">{guests.couples}</span>
              <button 
                onClick={() => updateGuests('couples', 'add')}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-800"
              >+</button>
            </div>
          </div>

          {/* Ligne Animaux */}
          <div className="flex items-center justify-between py-4">
            <div>
              <div className="font-semibold text-gray-900">Animaux</div>
              <div className="text-sm text-gray-500">Chat, chien, etc.</div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => updateGuests('pets', 'remove')}
                disabled={guests.pets === 0}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-800 disabled:opacity-30"
              >-</button>
              <span className="w-4 text-center">{guests.pets}</span>
              <button 
                onClick={() => updateGuests('pets', 'add')}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-800"
              >+</button>
            </div>
          </div>

        </div>
      )}

      {/* OVERLAY (Pour fermer en cliquant ailleurs) */}
      {activeTab && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setActiveTab(null)}
        ></div>
      )}
    </div>
  )
}
