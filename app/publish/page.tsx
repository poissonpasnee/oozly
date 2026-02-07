'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PublishPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Formulaire
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    bond: '',
    type: 'private_room',
    imageUrl: '',
    couples: false
  })

  const handleChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('listings').insert({
      title: formData.title,
      description: formData.description,
      location_name: formData.location,
      price_per_week: parseInt(formData.price),
      bond_amount: parseInt(formData.bond),
      type: formData.type,
      couples_accepted: formData.couples,
      images: [formData.imageUrl || 'https://via.placeholder.com/600'], // Image par défaut si vide
      host_id: user.id,
      lat: -33.8688, // Par défaut Sydney (à améliorer avec API Maps)
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
      
      {/* Header avec bouton fermer */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">✕</Link>
        <h1 className="font-bold">Publier une annonce</h1>
        <div className="w-8"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-lg mx-auto">
        
        {/* Titre */}
        <div>
          <label className="block text-sm font-bold mb-2">Titre de l'annonce</label>
          <input 
            type="text" name="title" required
            placeholder="Ex: Grande chambre ensoleillée à Bondi"
            className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent"
            onChange={handleChange}
          />
        </div>

        {/* Localisation */}
        <div>
          <label className="block text-sm font-bold mb-2">Ville / Quartier</label>
          <input 
            type="text" name="location" required
            placeholder="Ex: Surry Hills, Sydney"
            className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent"
            onChange={handleChange}
          />
        </div>

        {/* Type & Prix */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">Loyer / semaine</label>
            <input 
              type="number" name="price" required
              placeholder="$"
              className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Caution (Bond)</label>
            <input 
              type="number" name="bond" required
              placeholder="$"
              className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold mb-2">Description</label>
          <textarea 
            name="description" required rows={4}
            placeholder="Décrivez l'ambiance, les colocs..."
            className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent"
            onChange={handleChange}
          />
        </div>

        {/* Options */}
        <div className="flex items-center justify-between py-2 border-t border-b border-gray-100 dark:border-gray-800">
           <span>Couples acceptés ?</span>
           <input type="checkbox" name="couples" className="w-6 h-6 accent-rose-500" onChange={handleChange} />
        </div>

        {/* Image (URL pour l'instant) */}
        <div>
           <label className="block text-sm font-bold mb-2">Photo (URL)</label>
           <input 
             type="url" name="imageUrl"
             placeholder="https://..."
             className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent"
             onChange={handleChange}
           />
           <p className="text-xs text-gray-500 mt-1">Copiez le lien d'une image (Unsplash, etc.)</p>
        </div>

        {/* Bouton Submit */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl text-lg hover:bg-rose-600 transition disabled:opacity-50"
        >
          {loading ? 'Publication...' : 'Publier mon annonce'}
        </button>

      </form>
    </div>
  )
}
