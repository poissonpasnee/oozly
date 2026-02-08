'use client'
import { useState, useEffect } from 'react'

const AMENITIES_OPTIONS = [
  'Wifi', 'Climatisation', 'TV', 'Cuisine équipée', 
  'Lave-linge', 'Sèche-linge', 'Balcon', 'Terrasse', 
  'Jardin', 'Parking', 'Piscine', 'Ascenseur'
]

interface FiltersModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: any) => void
}

export default function FiltersModal({ isOpen, onClose, onApply }: FiltersModalProps) {
  const [priceRange, setPriceRange] = useState([0, 2000])
  const [womenOnly, setWomenOnly] = useState(false)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [type, setType] = useState('any')
  
  // NOUVEAU : Gestion disponibilité
  const [availableNow, setAvailableNow] = useState(false)
  const [targetDate, setTargetDate] = useState('') // Format YYYY-MM-DD

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity))
    } else {
      setSelectedAmenities([...selectedAmenities, amenity])
    }
  }

  const handleApply = () => {
    onApply({
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      womenOnly,
      amenities: selectedAmenities,
      type,
      availableNow, // Envoi du filtre "Maintenant"
      targetDate    // Envoi de la date cible
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 w-full sm:w-[500px] sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto flex flex-col">
        
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-900 z-10 py-2 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold dark:text-white">Filtres</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">✕</button>
        </div>

        <div className="space-y-8 pb-24">
          
          {/* --- NOUVEAU : SECTION DISPONIBILITÉ --- */}
          <div>
            <h3 className="font-bold mb-3 dark:text-white text-sm uppercase text-gray-500">Disponibilité</h3>
            
            {/* Switch Disponible Maintenant */}
            <div className="flex items-center justify-between mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
               <div>
                 <div className="font-bold text-green-700 dark:text-green-400">Disponible maintenant</div>
                 <div className="text-xs text-green-600/70 dark:text-green-500/70">Emménagement immédiat</div>
               </div>
               <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${availableNow ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <input type="checkbox" className="sr-only" checked={availableNow} onChange={(e) => setAvailableNow(e.target.checked)} />
                  <span className={`${availableNow ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
               </div>
            </div>

            {/* Date Picker (Désactivé si "Disponible maintenant" est coché) */}
            <div className={`transition-opacity ${availableNow ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <label className="block text-sm font-bold mb-2 dark:text-white">À partir du :</label>
              <input 
                type="date" 
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Section Type */}
          <div>
            <h3 className="font-bold mb-3 dark:text-white text-sm uppercase text-gray-500">Type de logement</h3>
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {['any', 'private_room', 'entire_home'].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold capitalize transition-all ${
                    type === t ? 'bg-white dark:bg-gray-600 shadow-md text-black dark:text-white transform scale-[1.02]' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {t === 'any' ? 'Tout' : t === 'private_room' ? 'Chambre' : 'Logement'}
                </button>
              ))}
            </div>
          </div>

          {/* Section Prix */}
          <div>
            <div className="flex justify-between mb-4">
               <h3 className="font-bold dark:text-white text-sm uppercase text-gray-500">Prix max</h3>
               <span className="font-bold text-rose-500 text-lg">${priceRange[1]} <span className="text-xs text-gray-400">/semaine</span></span>
            </div>
            <input 
              type="range" min="0" max="2000" step="50"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
              className="w-full accent-rose-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Section Femmes */}
          <div className="py-4 border-y border-gray-100 dark:border-gray-800">
             <label className="flex items-center justify-between cursor-pointer group">
               <div>
                 <div className="font-bold dark:text-white">Femmes uniquement</div>
               </div>
               <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${womenOnly ? 'bg-rose-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <input type="checkbox" className="sr-only" checked={womenOnly} onChange={(e) => setWomenOnly(e.target.checked)} />
                  <span className={`${womenOnly ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
               </div>
             </label>
          </div>

          {/* Section Équipements */}
          <div>
            <h3 className="font-bold mb-4 dark:text-white text-sm uppercase text-gray-500">Équipements</h3>
            <div className="flex flex-wrap gap-3">
              {AMENITIES_OPTIONS.map(amenity => (
                <button 
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all active:scale-95 ${
                    selectedAmenities.includes(amenity) ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <button onClick={handleApply} className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition transform">
            Afficher les résultats
          </button>
        </div>
      </div>
    </div>
  )
}
