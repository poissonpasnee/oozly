'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Liste des équipements possibles
const AMENITIES_OPTIONS = [
  'Wifi', 'Climatisation', 'TV', 'Cuisine équipée', 
  'Lave-linge', 'Sèche-linge', 'Balcon', 'Terrasse', 
  'Jardin', 'Parking', 'Piscine', 'Ascenseur'
]

// Villes simulées pour l'autocomplétion
const CITIES = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Bondi Beach', 'Surry Hills', 'Newtown']

export default function PublishPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // États Formulaire
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    bond: '',
    type: 'private_room',
    couples: false,
    women_only: false
  })
  
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // État Autocomplétion
  const [suggestions, setSuggestions] = useState<string[]>([])

  const handleChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
    
    // Autocomplétion Adresse
    if (e.target.name === 'location') {
       if (value.length > 1) {
         setSuggestions(CITIES.filter(c => c.toLowerCase().includes(value.toLowerCase())))
       } else {
         setSuggestions([])
       }
    }
  }

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity))
    } else {
      setSelectedAmenities([...selectedAmenities, amenity])
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // CORRECTION ICI : Une seule accolade !
    const {  { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('listings').insert({
      title: formData.title,
      description: formData.description,
      location_name: formData.location,
      price_per_week: parseInt(formData.price),
      bond_amount: parseInt(formData.bond),
      type: formData.type,
      couples_accepted: formData.couples,
      women_only: formData.women_only,
      amenities: selectedAmenities,
      images: imagePreview ? [imagePreview] : [],
      host_id: user.id,
      lat: -33.8688, 
      lng: 151.2093
    })

    if (error) {
      alert('Erreur: ' + error.message)
    } else {
      alert('Annonce publiée avec succès !')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24 text-gray-900 dark:text-white transition-colors">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-50">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 font-bold">✕</Link>
        <h1 className="font-bold text-lg">Publier une annonce</h1>
        <div className="w-8"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8 max-w-lg mx-auto">
        
        {/* SECTION 1: PHOTOS */}
        <section>
          <h2 className="text-xl font-bold mb-4">Photos</h2>
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden">
             {imagePreview ? (
               <img src={imagePreview} className="w-full h-full object-cover" />
             ) : (
               <div className="text-center p-4">
                 <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 <span className="text-gray-500 font-medium">Ajouter une photo</span>
               </div>
             )}
             <input 
               type="file" 
               accept="image/*" 
               onChange={handleImageUpload}
               className="absolute inset-0 opacity-0 cursor-pointer"
             />
          </div>
        </section>

        {/* SECTION 2: INFOS */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Détails</h2>
          
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Titre</label>
            <input 
              type="text" name="title" required
              placeholder="Ex: Superbe chambre vue mer"
              className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent"
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Adresse / Quartier</label>
            <input 
              type="text" name="location" required
              placeholder="Commencez à taper..."
              className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent"
              value={formData.location}
              onChange={handleChange}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 mt-1 max-h-48 overflow-y-auto">
                 {suggestions.map(s => (
                   <div 
                     key={s} 
                     className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                     onClick={() => { setFormData({...formData, location: s}); setSuggestions([]); }}
                   >
                     📍 {s}
                   </div>
                 ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Loyer/semaine</label>
              <input 
                type="number" name="price" required placeholder="$"
                className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Caution</label>
              <input 
                type="number" name="bond" required placeholder="$"
                className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent"
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Description</label>
            <textarea 
              name="description" required rows={4}
              placeholder="Dites-en plus sur la colocation..."
              className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent"
              onChange={handleChange}
            />
          </div>
        </section>

        {/* SECTION 3: PRÉFÉRENCES */}
        <section>
          <h2 className="text-xl font-bold mb-4">Préférences</h2>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
               <div>
                 <div className="font-bold">Couples acceptés</div>
                 <div className="text-xs text-gray-500">Autoriser deux personnes</div>
               </div>
               <input type="checkbox" name="couples" className="w-6 h-6 accent-rose-500" onChange={handleChange} />
             </div>
             
             <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
               <div>
                 <div className="font-bold">Femmes uniquement</div>
                 <div className="text-xs text-gray-500">Réservé aux locataires femmes</div>
               </div>
               <input type="checkbox" name="women_only" className="w-6 h-6 accent-rose-500" onChange={handleChange} />
             </div>
          </div>
        </section>

        {/* SECTION 4: ÉQUIPEMENTS */}
        <section>
          <h2 className="text-xl font-bold mb-4">Équipements</h2>
          <div className="grid grid-cols-2 gap-3">
             {AMENITIES_OPTIONS.map(amenity => (
               <div 
                 key={amenity}
                 onClick={() => toggleAmenity(amenity)}
                 className={`p-3 rounded-lg border cursor-pointer text-sm font-medium transition ${
                   selectedAmenities.includes(amenity) 
                     ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600' 
                     : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                 }`}
               >
                 {selectedAmenities.includes(amenity) ? '✓ ' : ''}{amenity}
               </div>
             ))}
          </div>
        </section>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl text-lg hover:bg-rose-600 transition disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Publication en cours...' : 'Publier mon annonce'}
          </button>
        </div>
      </form>
    </div>
  )
}
