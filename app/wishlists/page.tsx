'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ListingCard from '@/components/ListingCard'

export default function WishlistsPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // On récupère les IDs des favoris
      // Note: Il faudra créer la table 'favorites' dans Supabase (voir script plus bas)
      const { data: favs, error } = await supabase
        .from('favorites')
        .select('listing_id, listings(*)')
      
      if (favs) {
        // Formater les données pour ListingCard
        const formatted = favs.map((f: any) => ({
          id: f.listings.id,
          title: f.listings.title,
          location: f.listings.location_name,
          type: f.listings.type,
          price_per_week: f.listings.price_per_week,
          bond: f.listings.bond_amount,
          rating: 4.9,
          reviews_count: 0,
          image: f.listings.images?.[0] || '',
          dates: 'Disponible',
          is_superhost: false
        }))
        setFavorites(formatted)
      }
      setLoading(false)
    }
    fetchFavorites()
  }, [supabase, router])

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Favoris</h1>
        
        {loading ? (
          <div>Chargement...</div>
        ) : favorites.length === 0 ? (
          <div className="text-gray-500 mt-10">
            <p className="mb-4">Aucun favori pour l'instant.</p>
            <p>Cliquez sur le cœur ❤️ d'une annonce pour l'ajouter ici.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {favorites.map(fav => (
              <ListingCard key={fav.id} data={fav} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
