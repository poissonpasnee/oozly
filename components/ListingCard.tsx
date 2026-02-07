'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react' // <--- IMPORT
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs' // <--- IMPORT

// ... (Interface ListingCardProps reste inchangée)

export default function ListingCard({ data }: ListingCardProps) {
  const supabase = createClientComponentClient()
  const [isLiked, setIsLiked] = useState(false)

  // Fonction pour liker/disliker
  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault() // Empêche d'ouvrir l'annonce
    e.stopPropagation()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Connectez-vous pour ajouter aux favoris")

    if (isLiked) {
       // Supprimer (Optionnel pour l'instant)
       setIsLiked(false)
    } else {
       // Ajouter
       const { error } = await supabase
         .from('favorites')
         .insert({ user_id: user.id, listing_id: data.id })
       
       if (error) {
         // Si erreur "duplicate key", c'est qu'il est déjà favori, donc on ignore
         if (error.code !== '23505') alert("Erreur ajout favori")
       } else {
         setIsLiked(true)
       }
    }
  }

  return (
    <Link href={`/room?id=${data.id}`} className="block h-full relative group">
      {/* ... Image ... */}
        
        {/* LE BOUTON CŒUR CORRIGÉ */}
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

      {/* ... Reste de la carte ... */}
