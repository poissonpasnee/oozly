'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const AMENITIES_OPTIONS = [
  'Wifi', 'Climatisation', 'TV', 'Cuisine équipée', 
  'Lave-linge', 'Sèche-linge', 'Balcon', 'Terrasse', 
  'Jardin', 'Parking', 'Piscine', 'Ascenseur'
]

const CITIES = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Bondi Beach', 'Surry Hills', 'Newtown']

export default function PublishPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '', description: '', location: '', price: '', bond: '',
    type: 'private_room', couples: false, women_only: false
  })
  
  // NOUVEAU : GESTION DES PLAGES DE DATES
  const [ranges, setRanges] = useState<{start: string, end: string}[]>([])
  const [tempStart, setTempStart] = useState('')
  const [tempEnd, setTempEnd] = useState('')

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const handleChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
    
    if (e.target.name === 'location') {
       if (value.length > 1) {
         setSuggestions(CITIES.filter(c => c.toLowerCase().includes(value.toLowerCase())))
       } else {
         setSuggestions([])
       }
    }
  }

  const addRange = () => {
    if (tempStart && tempEnd) {
      if (tempStart > tempEnd) { alert("La date de fin doit être après la date de début"); return; }
      setRanges([...ranges, { start: tempStart, end: tempEnd }])
      setTempStart('')
      setTempEnd('')
    }
  }

  const removeRange = (index: number) => {
    setRanges(ranges.filter((_, i) => i !== index))
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
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); setLoading(false); return }

    const { error } = await supabase.from('listings').insert({
      title: formData.title,
      description: formData.description,
      location_name: formData.location,
      price_per_week: parseInt(formData.price) || 0,
      bond_amount: parseInt(formData.bond) || 0,
      type: formData.type,
      couples_accepted: formData.couples,
      women_only: formData.women_only,
      amenities: selectedAmenities,
      availability_ranges: ranges, // ON SAUVEGARDE LE TABLEAU DE DATES
      images: imagePreview ? [imagePreview] : [],
      host_id: user.id,
      lat: -33.8688, 
      lng: 151.2093
    })

    if (error) alert('Erreur: ' + error.message)
    else { alert('Annonce publiée !'); router.push('/') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24 text-gray-900 dark:text-white transition-colors">
      <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-50">
        <Link href="/" className="p-2 font-bold">✕</Link>
        <h1 className="font-bold text-lg">Publier une annonce</h1>
        <div className="w-8"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8 max-w-lg mx-auto">
        <section>
          <h2 className="text-xl font-bold mb-4">Photos</h2>
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden">
             {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <span className="text-gray-500 font-medium">Ajouter une photo</span>}
             <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Détails</h2>
          <div>
            <label className="block text-sm font-bold mb-2">Titre</label>
            <input type="text" name="title" required placeholder="Ex: Superbe chambre" className="w-full p-4 rounded-xl border bg-transparent" onChange={handleChange} />
          </div>
          <div className="relative">
            <label className="block text-sm font-bold mb-2">Adresse</label>
            <input type="text" name="location" required placeholder="Ville..." className="w-full p-4 rounded-xl border bg-transparent" value={formData.location} onChange={handleChange} autoComplete="off" />
            {suggestions.length > 0 && (
              <div className="absolute top-full w-full bg-white dark:bg-gray-800 border rounded-xl shadow-xl z-20 mt-1 max-h-48 overflow-y-auto">
                 {suggestions.map(s => <div key={s} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onClick={() => { setFormData({...formData, location: s}); setSuggestions([]); }}>📍 {s}</div>)}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold mb-2">Prix/semaine</label><input type="number" name="price" required className="w-full p-4 rounded-xl border bg-transparent" onChange={handleChange} /></div>
            <div><label className="block text-sm font-bold mb-2">Caution</label><input type="number" name="bond" required className="w-full p-4 rounded-xl border bg-transparent" onChange={handleChange} /></div>
          </div>
          
          {/* --- NOUVEAU SÉLECTEUR DE DATES MULTIPLES --- */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
             <label className="block text-sm font-bold mb-3">Disponibilités</label>
             <div className="flex gap-2 items-end mb-4">
                <div className="flex-1">
                   <span className="text-xs text-gray-500">Du</span>
                   <input type="date" value={tempStart} onChange={e => setTempStart(e.target.value)} className="w-full p-2 rounded-lg border bg-white dark:bg-gray-700" />
                </div>
                <div className="flex-1">
                   <span className="text-xs text-gray-500">Au</span>
                   <input type="date" value={tempEnd} onChange={e => setTempEnd(e.target.value)} className="w-full p-2 rounded-lg border bg-white dark:bg-gray-700" />
                </div>
                <button type="button" onClick={addRange} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-2 rounded-lg font-bold">OK</button>
             </div>
             
             {/* Liste des dates ajoutées */}
             <div className="space-y-2">
               {ranges.map((r, i) => (
                 <div key={i} className="flex justify-between items-center bg-white dark:bg-gray-700 p-2 rounded-lg text-sm border border-gray-200 dark:border-gray-600">
                    <span>📅 {r.start} ➝ {r.end}</span>
                    <button type="button" onClick={() => removeRange(i)} className="text-red-500 font-bold px-2">✕</button>
                 </div>
               ))}
               {ranges.length === 0 && <p className="text-xs text-gray-400 italic">Aucune date ajoutée (disponible tout le temps par défaut)</p>}
             </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Description</label>
            <textarea name="description" required rows={4} className="w-full p-4 rounded-xl border bg-transparent" onChange={handleChange} />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Préférences & Équipements</h2>
          <div className="space-y-4 mb-6">
             <div className="flex justify-between p-4 border rounded-xl items-center"><div>Femmes uniquement</div><input type="checkbox" name="women_only" className="w-5 h-5 accent-rose-500" onChange={handleChange} /></div>
             <div className="flex justify-between p-4 border rounded-xl items-center"><div>Couples acceptés</div><input type="checkbox" name="couples" className="w-5 h-5 accent-rose-500" onChange={handleChange} /></div>
          </div>
          <div className="flex flex-wrap gap-2">
             {AMENITIES_OPTIONS.map(a => (
               <div key={a} onClick={() => toggleAmenity(a)} className={`p-2 rounded-lg border cursor-pointer text-sm ${selectedAmenities.includes(a) ? 'border-rose-500 bg-rose-50 text-rose-600' : ''}`}>{a}</div>
             ))}
          </div>
        </section>

        <button type="submit" disabled={loading} className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg">{loading ? '...' : 'Publier'}</button>
      </form>
    </div>
  )
}
