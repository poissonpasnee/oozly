'use client'

import { useState } from 'react'

export default function SearchBar() {
  const [activeTab, setActiveTab] = useState<'location' | 'date' | 'who' | null>(null)
  
  // États (inchangés)
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [guests, setGuests] = useState({ adults: 0, couples: 0, pets: 0 })

  const updateGuests = (type: keyof typeof guests, operation: 'add' | 'remove') => {
    setGuests(prev => {
      const newValue = operation === 'add' ? prev[type] + 1 : prev[type] - 1
      return { ...prev, [type]: Math.max(0, newValue) }
    })
  }

  const totalGuests = guests.adults + (guests.couples * 2)

  return (
    <>
      {/* === VERSION MOBILE (Visible uniquement sur petits écrans) === */}
      <div className="lg:hidden w-full">
         <div className="bg-white rounded-full shadow-md border border-gray-200 flex items-center p-3 gap-4 active:scale-95 transition-transform cursor-pointer">
            <div className="pl-2">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-800">
                  <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
               </svg>
            </div>
            <div className="flex-col flex">
               <span className="text-sm font-semibold text-gray-900">Où allez-vous ?</span>
               <div className="text-xs text-gray-500 flex gap-1">
                 <span>N'importe où</span> • <span>Une semaine</span> • <span>Ajouter...</span>
               </div>
            </div>
            <div className="ml-auto bg-white border border-gray-200 rounded-full p-2">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-800">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
               </svg>
            </div>
         </div>
      </div>

      {/* === VERSION DESKTOP (Visible uniquement sur grands écrans lg:) === */}
      <div className="hidden lg:block relative w-full max-w-4xl mx-auto">
        <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-16 relative z-50">
          
          {/* SECTION OÙ */}
          <div onClick={() => setActiveTab('location')} className="flex-1 relative pl-8 pr-4 py-3 rounded-full cursor-pointer hover:bg-gray-100">
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

          {/* SECTION QUAND */}
          <div onClick={() => setActiveTab('date')} className="flex-1 relative px-6 py-3 cursor-pointer hover:bg-gray-100 rounded-full">
            <div className="text-xs font-bold text-gray-800">Quand ?</div>
            <div className="text-sm text-gray-400 truncate">{date ? date : "Date d'emménagement"}</div>
          </div>

          <div className="h-8 w-[1px] bg-gray-200"></div>

          {/* SECTION QUI */}
          <div onClick={() => setActiveTab(activeTab === 'who' ? null : 'who')} className="flex-[1.2] pl-6 pr-2 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-100 rounded-full">
            <div className="flex flex-col">
              <div className="text-xs font-bold text-gray-800">Qui ?</div>
              <div className="text-sm text-gray-400 truncate">
                 {totalGuests > 0 ? `${totalGuests} voyageurs` : 'Ajouter des voyageurs'}
              </div>
            </div>
            <button className="bg-[#FF385C] hover:bg-[#d93250] text-white p-3 rounded-full flex items-center justify-center shadow-md ml-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 font-bold">
                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
              </svg>
              <span className="ml-2 font-medium hidden xl:block pr-1">Rechercher</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
