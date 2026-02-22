'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ListingCardProps {
  data: {
    id: string
    host_id?: string
    created_at?: string
    title: string
    location?: string
    location_name?: string
    image?: string
    price_per_week: number
    rating?: number
    dates?: string
    is_superhost?: boolean
    type?: string
    isVip?: boolean
    [key: string]: any
  }
}

export default function ListingCard({ data }: ListingCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
      setIsFavorite(Array.isArray(favorites) && favorites.includes(data.id))
    } catch {
      setIsFavorite(false)
    }
  }, [data.id])

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
      const safeFavs = Array.isArray(favorites) ? favorites : []
      const newFavorites = isFavorite ? safeFavs.filter((id: string) => id !== data.id) : [...safeFavs, data.id]

      localStorage.setItem('favorites', JSON.stringify(newFavorites))
      setIsFavorite(!isFavorite)
    } catch {
      // Si localStorage est corrompu, on réinitialise proprement
      localStorage.setItem('favorites', JSON.stringify([data.id]))
      setIsFavorite(true)
    }
  }

  const location = data.location || data.location_name || 'Lieu inconnu'
  const image = data.image || 'https://via.placeholder.com/600x400'

  return (
    <Link href={`/listing?id=${data.id}`} className="group cursor-pointer block h-full">
      {/* Conteneur Image avec coins très arrondis */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-gray-200 border border-black/5 dark:border-white/10 shadow-sm transition-shadow duration-300 hover:shadow-xl">
        <img
          src={image}
          alt={data.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />

        {/* Badge VIP */}
        {data.isVip && (
          <div className="absolute top-4 left-4 bg-yellow-400/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-extrabold shadow-lg text-black flex items-center gap-1">
            <span aria-hidden>👑</span>
            <span>VIP</span>
          </div>
        )}

        {/* Badge Superhôte (si tu le gardes en parallèle) */}
        {!data.isVip && data.is_superhost && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold shadow-lg text-black flex items-center gap-1">
            <span aria-hidden>🏆</span>
            <span>Superhôte</span>
          </div>
        )}

        {/* Bouton Cœur Flottant */}
        <button
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="absolute top-3 right-3 p-3 rounded-full bg-black/20 backdrop-blur-md hover:bg-white/90 transition-all active:scale-90 group/heart"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isFavorite ? '#f43f5e' : 'transparent'}
            stroke={isFavorite ? '#f43f5e' : 'white'}
            strokeWidth={2.5}
            className="w-5 h-5 transition-colors group-hover/heart:stroke-rose-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>
      </div>

      {/* Infos sous la carte */}
      <div className="mt-4 px-2">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-snug truncate pr-2">{location}</h3>
          <div className="flex items-center gap-1 text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
            <span aria-hidden>★</span>
            <span>{data.rating || 4.9}</span>
          </div>
        </div>

        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          {data.type === 'private_room' ? 'Chambre privée' : 'Logement entier'}
        </p>
        <p className="text-gray-400 text-sm mb-3">{data.dates || 'Dispo. flexible'}</p>

        <div className="flex items-baseline gap-1">
          <span className="font-bold text-gray-900 dark:text-white text-lg">${data.price_per_week}</span>
          <span className="text-gray-500 text-sm">par semaine</span>
        </div>
      </div>
    </Link>
  )
}
