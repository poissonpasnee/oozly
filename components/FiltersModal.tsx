'use client'
import { useState } from 'react'

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
      type
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={onClose} />
      <div className="bg-white dark:bg-gray-900 w-full sm:w-[500px] sm:rounded-2xl rounded-t-2xl p-6 pointer-events-auto max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold dark:text-white">Filtres</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full dark:text-white">✕</button>
        </div>

        <div className="space-y-6 pb-20">
          {/* Type */}
          <div>
            <h3 className="font-bold mb-3 dark:text-white">Type de logement</h3>
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {['any', 'private_room', 'entire_home'].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                    type === t ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {t === 'any' ? 'Tout' : t === 'private_room' ? 'Chambre' : 'Logement'}
                </button>
              ))}
            </div>
          </div>

          {/* Prix */}
          <div>
            <h3 className="font-bold mb-3 dark:text-white">Prix max: ${priceRange[1]}/semaine</h3>
            <input 
              type="range" min="0" max="2000" step="50"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
              className="w-full accent-rose-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Femmes Uniquement */}
          <div className="flex items-center justify-between py-2 border-y border-gray-100 dark:border-gray-800">
             <span className="font-bold dark:text-white">Femmes uniquement</span>
             <input 
               type="checkbox" 
               checked={womenOnly}
               onChange={(e) => setWomenOnly(e.target.checked)}
               className="w-6 h-6 accent-rose-500" 
             />
          </div>

          {/* Équipements */}
          <div>
            <h3 className="font-bold mb-3 dark:text-white">Équipements</h3>
            <div className="grid grid-cols-2 gap-3">
              {AMENITIES_OPTIONS.map(amenity => (
                <div 
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`p-2 rounded-lg border text-sm cursor-pointer transition ${
                    selectedAmenities.includes(amenity) 
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600' 
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {amenity}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={handleApply}
            className="w-full bg-rose-500 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition"
          >
            Afficher les résultats
          </button>
        </div>
      </div>
    </div>
  )
}
