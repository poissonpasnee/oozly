'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation' // NOUVEAU: useParams
import Link from 'next/link'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), { 
  loading: () => <div className="h-64 w-full bg-gray-100 rounded-xl animate-pulse"/>,
  ssr: false 
})

// On supprime { params } des props ici
export default function ListingPage() {
  const params = useParams() // On récupère l'ID côté client
  const id = params?.id as string // Sécurisation du type

  const supabase = createClientComponentClient()
  const router = useRouter()
  const [listing, setListing] = useState<any>(null)
  const [host, setHost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return // Attendre que l'ID soit dispo

    const fetchListing = async () => {
      const { data: listingData, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !listingData) {
        setLoading(false)
        return
      }
      setListing(listingData)

      if (listingData.host_id) {
        const { data: hostData } = await supabase.from('profiles').select('*').eq('id', listingData.host_id).single()
        setHost(hostData)
      }
      setLoading(false)
    }
    fetchListing()
  }, [id, supabase]) // Dépendance sur 'id'

  if (loading) return <div className="min-h-screen bg-white dark:bg-gray-900 animate-pulse p-4"><div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl mb-4"/><div className="h-8 w-2/3 bg-gray-200 dark:bg-gray-800 rounded mb-4"/></div>
  
  if (!listing) return <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center dark:text-white"><h1 className="text-2xl font-bold mb-2">Introuvable</h1><Link href="/" className="text-rose-500 underline">Retour</Link></div>

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24 text-gray-900 dark:text-white">
      {/* Header Mobile Navigation */}
      <div className="fixed top-0 w-full z-10 flex justify-between p-4 pointer-events-none lg:hidden">
        <button onClick={() => router.back()} className="bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-sm pointer-events-auto backdrop-blur-sm dark:text-white">←</button>
      </div>

      {/* Image */}
      <div className="relative h-[300px] lg:h-[400px] w-full bg-gray-200">
        <img src={listing.images?.[0] || 'https://via.placeholder.com/800x600'} className="w-full h-full object-cover" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
        <div className="flex justify-between items-start mb-6">
           <div>
             <p className="text-gray-500 dark:text-gray-400">{listing.location_name}</p>
             <div className="flex gap-2 text-xs mt-1">
               {listing.type === 'private_room' ? <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Chambre privée</span> : <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Logement entier</span>}
             </div>
           </div>
           <div className="text-right">
             <div className="text-2xl font-bold">${listing.price_per_week}</div>
             <div className="text-xs text-gray-500">/ semaine</div>
           </div>
        </div>

        {/* Disponibilités */}
        <div className="py-6 border-y border-gray-100 dark:border-gray-800">
           <h2 className="font-bold text-lg mb-3">Disponibilités</h2>
           {listing.availability_ranges && listing.availability_ranges.length > 0 ? (
             <div className="flex flex-wrap gap-2">
               {listing.availability_ranges.map((range: any, i: number) => (
                 <div key={i} className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300 font-medium">
                   Du {new Date(range.start).toLocaleDateString()} au {new Date(range.end).toLocaleDateString()}
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-gray-500 text-sm italic">Contactez l'hôte pour les dates.</div>
           )}
        </div>

        {/* Hôte */}
        <div className="flex items-center gap-4 py-6 border-b border-gray-100 dark:border-gray-800">
           <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
             {host?.avatar_url ? <img src={host.avatar_url} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full font-bold text-gray-500">?</span>}
           </div>
           <div>
             <div className="font-bold">Hôte : {host?.full_name || 'Anonyme'}</div>
             <div className="text-sm text-gray-500">Membre vérifié</div>
           </div>
        </div>

        {/* Description */}
        <div className="py-6 whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
          {listing.description}
        </div>

        {/* Carte */}
        <div className="h-48 rounded-xl overflow-hidden bg-gray-100 relative z-0 mt-4">
           <Map listings={[listing]} />
        </div>
      </div>

      {/* Barre Contact Bas */}
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 pb-8 flex justify-between items-center z-20">
         <div className="font-bold text-lg">${listing.price_per_week} <span className="text-sm font-normal text-gray-500">/ sem</span></div>
         <button className="bg-rose-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-rose-600 transition">Contacter</button>
      </div>
    </div>
  )
}

// C'est ICI le secret pour que le build passe : on génère une liste vide !
export async function generateStaticParams() {
  return []
}
