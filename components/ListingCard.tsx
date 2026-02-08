'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Carte statique pour la localisation (évite de charger l'interactive lourde)
const Map = dynamic(() => import('@/components/Map'), { 
  loading: () => <div className="h-64 w-full bg-gray-100 rounded-xl animate-pulse"/>,
  ssr: false 
})

export default function ListingPage({ params }: { params: { id: string } }) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [listing, setListing] = useState<any>(null)
  const [host, setHost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchListing = async () => {
      // 1. Récupérer l'annonce
      const { data: listingData, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !listingData) {
        setLoading(false)
        return
      }

      setListing(listingData)

      // 2. Récupérer l'hôte
      if (listingData.host_id) {
        const { data: hostData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', listingData.host_id)
          .single()
        
        setHost(hostData)
      }
      
      setLoading(false)
    }

    fetchListing()
  }, [params.id, supabase])

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-gray-900 animate-pulse p-4">
      <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl mb-4"/>
      <div className="h-8 w-2/3 bg-gray-200 dark:bg-gray-800 rounded mb-4"/>
      <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-800 rounded"/>
    </div>
  )

  if (!listing) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold mb-2">Annonce introuvable 😕</h1>
      <p className="text-gray-500 mb-6">Cette annonce a peut-être été supprimée.</p>
      <Link href="/" className="bg-rose-500 text-white px-6 py-3 rounded-full font-bold">Retour à l'accueil</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24 text-gray-900 dark:text-white">
      
      {/* HEADER NAV MOBILE */}
      <div className="fixed top-0 w-full z-10 flex justify-between p-4 bg-gradient-to-b from-black/50 to-transparent lg:hidden pointer-events-none">
        <button onClick={() => router.back()} className="bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-sm pointer-events-auto backdrop-blur-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button className="bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-sm pointer-events-auto backdrop-blur-sm">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </button>
      </div>

      {/* IMAGE HERO */}
      <div className="relative h-[300px] lg:h-[400px] w-full bg-gray-200">
        <img 
          src={listing.images?.[0] || 'https://via.placeholder.com/800x600'} 
          alt={listing.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* TITRE ET PRIX */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold leading-tight mb-2">{listing.title}</h1>
          <div className="flex justify-between items-start">
             <div>
               <p className="text-gray-500 dark:text-gray-400 font-medium">{listing.location_name}</p>
               <div className="flex gap-2 text-xs mt-1">
                 {listing.women_only && <span className="bg-pink-100 text-pink-600 px-2 py-0.5 rounded font-bold">Femmes uniquement</span>}
                 {listing.type === 'private_room' ? <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">Chambre privée</span> : <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-bold">Logement entier</span>}
               </div>
             </div>
             <div className="text-right">
               <div className="text-2xl font-bold text-gray-900 dark:text-white">${listing.price_per_week}</div>
               <div className="text-xs text-gray-500">par semaine</div>
             </div>
          </div>
        </div>

        {/* HOST INFO */}
        <div className="flex items-center gap-4 py-6 border-y border-gray-100 dark:border-gray-800">
           <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
             {host?.avatar_url ? (
               <img src={host.avatar_url} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 bg-gray-100 text-xl">{host?.full_name?.charAt(0) || '?'}</div>
             )}
           </div>
           <div>
             <div className="font-bold">Proposé par {host?.full_name || 'Hôte'}</div>
             <div className="text-sm text-gray-500">Membre depuis 2024</div>
           </div>
        </div>

        {/* DESCRIPTION */}
        <div className="py-6">
          <h2 className="font-bold text-lg mb-3">À propos de ce logement</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {listing.description}
          </p>
        </div>

        {/* ÉQUIPEMENTS */}
        {listing.amenities && listing.amenities.length > 0 && (
          <div className="py-6 border-t border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-lg mb-4">Ce que propose ce logement</h2>
            <div className="grid grid-cols-2 gap-3">
              {listing.amenities.map((amenity: string) => (
                <div key={amenity} className="flex gap-3 items-center text-gray-600 dark:text-gray-300">
                   <span className="text-gray-400">✓</span>
                   <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CARTE */}
        <div className="py-6 border-t border-gray-100 dark:border-gray-800">
           <h2 className="font-bold text-lg mb-4">Localisation</h2>
           <div className="h-48 rounded-xl overflow-hidden bg-gray-100 relative z-0">
              <Map listings={[listing]} />
           </div>
           <p className="text-xs text-gray-400 mt-2">Position approximative pour la sécurité</p>
        </div>

      </div>

      {/* BARRE CONTACT FIXE BAS */}
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 pb-8 lg:pb-4 flex justify-between items-center z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
         <div>
            <span className="font-bold text-lg">${listing.price_per_week}</span>
            <span className="text-gray-500 text-sm"> / semaine</span>
         </div>
         <button 
           onClick={() => {
              // Ici on pourrait ouvrir un chat
              if(!host) alert("Impossible de contacter l'hôte");
              else router.push(`/inbox/chat?userId=${host.id}&listingId=${listing.id}`)
           }}
           className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-xl active:scale-95 transition"
         >
           Contacter
         </button>
      </div>

    </div>
  )
}
