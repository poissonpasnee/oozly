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
  
  // NOUVEAU: Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
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
      type
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center">
      {/* Overlay cliquable pour fermer */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Contenu du Modal */}
      <div className="relative bg-white dark:bg-gray-900 w-full sm:w-[500px] sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Header avec bouton fermer */}
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-900 z-10 py-2 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold dark:text-white">Filtres</h2>
          <button 
            onClick={onClose} 
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-8 pb-24">
          
          {/* Section Type */}
          <div>
            <h3 className="font-bold mb-3 dark:text-white text-sm uppercase text-gray-500">Type de logement</h3>
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {['any', 'private_room', 'entire_home'].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold capitalize transition-all ${
                    type === t 
                      ? 'bg-white dark:bg-gray-600 shadow-md text-black dark:text-white transform scale-[1.02]' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
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
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>$0</span>
              <span>$2000+</span>
            </div>
          </div>

         
