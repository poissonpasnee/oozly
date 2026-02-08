'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ListingCard from '@/components/ListingCard'
import Link from 'next/link'

export default function FavoritesPage() {
  const supabase = createClientComponentClient()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFavorites = async () => {
      // 1. Lire les IDs depuis le LocalStorage
      const storedFavs = localStorage.getItem('favorites')
      const favIds = storedFavs ? JSON.parse(storedFavs) : []

      if (favIds.length === 0) {
        setFavorites([])
        setLoading(false)
        return
      }

      // 2. Récupérer les détails de ces annonces depuis Supabase
      const { data } = await supabase
        .from('listings')
        .select('*')
        .in('id', favIds)

      if (data) {
        // Formattage identique à Home
        const formatted = data.map(item => ({
          id: item.id,
          title: item.title,
          location: item.location_name,
          type: item.type === 'private_room' ? 'Chambre privée' : 'Logement entier',
          price_per_week: item.price_per_week,
          bond: item.bond_amount,
          rating: 4.9,
          reviews_count: 0,
          image: item.images?.[0] || '',
          dates: 'Disponible',
          is_superhost: false,
          amenities: item.amenities || [],
          women_only: item.women_only
        }))
        setFavorites(formatted)
      }
      setLoading(false)
    }

    fetchFavorites()
  }, [])

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24 p-6">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Favoris</h1>
      
      {loading ? (
        <div className="text-gray-500">Chargement...</div>
      ) : favorites.length === 0 ? (
        <div className="text-center mt-20">
          <div className="text-4xl mb-4">💔</div>
          <p className="text-gray-500 mb-4">Aucun favori pour le moment.</p>
          <Link href="/" className="text-rose-500 font-bold underline">Explorer les annonces</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {favorites.map(listing => (
            <ListingCard key={listing.id} data={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
