'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ListingProps {
  data: any
}

export default function ListingCard({ data }: ListingProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  // 1. Vérifier si l'annonce est déjà en favori au chargement
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    if (favorites.includes(data.id)) {
      setIsFavorite(true)
    }
  }, [data.id])

  // 2. Gérer le clic sur le cœur
  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault() // Empêcher d'ouvrir l'annonce quand on clique sur le cœur
    e.stopPropagation()

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    let newFavorites

    if (isFavorite) {
      newFavorites = favorites.filter((id: string) => id !== data.id)
    } else {
      newFavorites = [...favorites, data.id]
    }

    localStorage.setItem('favorites', JSON.stringify(newFavorites))
    setIsFavorite(!isFavorite)
  }

  return (
    <Link href={`/listings/${data.id}`} className="group cursor-pointer block h-full">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-200">
        <img
          src={data.image || 'https://via.placeholder.com/600x400'}
          alt={data.title}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        
        {/* BOUTON CŒUR ACTIF */}
        <button
          onClick={toggleFavorite}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 active:scale-90 transition z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isFavorite ? '#f43f5e' : 'rgba(0,0,0,0.5)'} // Rose si favori, Noir transparent sinon
            stroke={isFavorite ? '#f43f5e' : 'white'}
            strokeWidth={2}
            className={`w-7 h-7 ${isFavorite ? 'drop-shadow-none' : 'drop-shadow-md'}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {data.is_superhost && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
            Superhôte
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-gray-900 dark:text-white truncate pr-2">{data.location}</h3>
          <div className="flex items-center gap-1 text-sm">
            <span>★</span>
            <span>{data.rating}</span>
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{data.title}</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{data.dates}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="font-bold text-gray-900 dark:text-white">${data.price_per_week}</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm">par semaine</span>
        </div>
      </div>
    </Link>
  )
}
