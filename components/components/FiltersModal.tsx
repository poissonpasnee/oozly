'use client'

import { useState } from 'react'

interface FiltersModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FiltersModal({ isOpen, onClose }: FiltersModalProps) {
  if (!isOpen) return null

  // États locaux pour les filtres
  const [priceRange, setPriceRange] = useState(450)
  const [bondMax, setBondMax] = useState(2000)
  const [selectedType, setSelectedType] = useState('all') // all, private, shared

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center">
      {/* Fond sombre (Overlay) */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* La Fenêtre Modale */}
      <div className="relative w-full max-w-2xl bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:h-auto h-full animate-in slide-in-from-bottom-10 duration-300">
        
        {/* 1. Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h2 className="font-bold text-lg">Filtres</h2>
          <div className="w-8"></div> {/* Spacer pour centrer le titre */}
        </div>

        {/* 2. Contenu Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section A : Type de logement */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Type de logement</h3>
            <div className="flex rounded-xl border border-gray-200 p-1">
              <button 
                onClick={() => setSelectedType('all')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${selectedType === 'all' ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-gray-50 text-gray-500'}`}
              >
                Tous
              </button>
              <button 
                onClick={() => setSelectedType('private')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${selectedType === 'private' ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-gray-50 text-gray-500'}`}
              >
                Chambre
              </button>
              <button 
                onClick={() => setSelectedType('shared')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${selectedType === 'shared' ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-gray-50 text-gray-500'}`}
              >
                Logement entier
              </button>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Section B : Prix (Loyer Hebdomadaire) */}
          <section>
            <h3 className="text-lg font-semibold mb-2">Fourchette de prix (Semaine)</h3>
            <p className="text-gray-500 text-sm mb-6">Prix par semaine, charges comprises.</p>
            
            {/* Graphique à barres décoratif (comme sur la photo) */}
            <div className="flex items-end justify-between h-12 px-4 gap-1 mb-2 opacity-50">
               {[20,40,30,50,80,90,40,30,60,40,20,10].map((h, i) => (
                 <div key={i} className="bg-rose-200 flex-1 rounded-t-sm" style={{ height: `${h}%` }}></div>
               ))}
            </div>

            <input 
              type="range" 
              min="100" 
              max="1000" 
              value={priceRange} 
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-rose-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-4">
              <div className="border border-gray-300 rounded-full px-4 py-2">
                <span className="text-xs text-gray-500 block">Minimum</span>
                <span className="font-semibold">$100</span>
              </div>
              <div className="border border-gray-300 rounded-full px-4 py-2">
                <span className="text-xs text-gray-500 block">Maximum</span>
                <span className="font-semibold">${priceRange}+</span>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Section C : Caution (Spécifique Oozly) */}
          <section>
            <h3 className="text-lg font-semibold mb-2">Caution Maximum (Bond)</h3>
            <p className="text-gray-500 text-sm mb-4">Filtrez les logements selon le dépôt de garantie requis.</p>
            
            <input 
              type="range" 
              min="0" 
              max="4000" 
              step="100"
              value={bondMax} 
              onChange={(e) => setBondMax(Number(e.target.value))}
              className="w-full accent-gray-900 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="mt-2 text-right font-bold text-gray-900">${bondMax} max</div>
          </section>

          <hr className="border-gray-100" />

          {/* Section D : Équipements */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Équipements</h3>
            <div className="grid grid-cols-2 gap-4">
              {['Wifi', 'Climatisation', 'Lave-linge', 'Parking gratuit', 'Piscine', 'Cuisine'].map((item) => (
                <label key={item} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                  <span className="text-gray-700">{item}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* 3. Footer */}
        <div className="border-t border-gray-100 p-6 bg-white flex justify-between items-center sm:rounded-b-2xl">
          <button 
            className="text-base font-semibold underline text-gray-900 hover:text-gray-600"
            onClick={() => { setPriceRange(1000); setBondMax(4000); setSelectedType('all'); }}
          >
            Tout effacer
          </button>
          <button 
            onClick={onClose}
            className="bg-[#222222] hover:bg-black text-white px-8 py-3.5 rounded-lg font-semibold text-base transition-transform active:scale-95"
          >
            Afficher les logements
          </button>
        </div>

      </div>
    </div>
  )
}
