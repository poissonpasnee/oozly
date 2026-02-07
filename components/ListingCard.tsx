'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ListingCardProps {
  data: {
    id: string
    title: string
    type: string
    location: string
    price_per_week: number
    image: string
    rating: number
    reviews_count: number
    dates: string
    is_superhost?: boolean
    bond?: number
  }
}

export default function ListingCard({ data }: ListingCardProps) {
  const supabase = createClientComponentClient()
  const [isLiked, setIsLiked] = useState(false)

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Connectez-vous pour ajouter aux favoris")

    if (isLiked) {
       setIsLiked(false)
    } else {
       const { error } = await supabase
         .from('favorites')
         .insert({ user_id: user.id, listing_id: data.id })
       
       if (error && error.code !== '23505') {
         alert("Erreur ajout favori")
       } else {
         setIsLiked(true)
       }
    }
  }

  return (
    <Link href={`/room?id=${data.id}`} className="block h-full relative group">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-200 mb-3">
        {data.image ? (
          <Image
            src={data.image}
            alt={data.title}
            fill
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
        
        {data.is_superhost && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm text-xs font-bold text-gray-800">
            Superhôte
          </div>
        )}

        <button 
          onClick={toggleLike}
          className="absolute top-3 right-3 p-2 rounded-full hover:scale-110 transition z-10 active:scale-90"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className={`w-7 h-7 drop-shadow-md ${isLiked ? 'fill-rose-500 text-rose-500' : 'fill-black/50 text-white'}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>
      </div>

      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate pr-4">{data.location}</h3>
          <p className="text-gray-500 text-sm truncate">{data.title}</p>
          <p className="text-gray-500 text-sm">{data.dates}</p>
          
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-bold text-gray-900 text-lg">${data.price_per_week}</span>
            <span className="text-gray-900">par semaine</span>
          </div>
          {data.bond && (
             <p className="text-xs text-gray-400 mt-0.5">Caution: ${data.bond}</p>
          )}
        </div>

        <div className="flex items-center gap-1 text-sm shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-900">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
          </svg>
          <span>{data.rating}</span>
          <span className="text-gray-500">({data.reviews_count})</span>
        </div>
      </div>
    </Link>
  )
}
