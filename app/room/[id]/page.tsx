'use client'

import { useEffect, useState } from 'react'
// On n'utilise plus useParams directement ici car ça peut planter en statique
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const MiniMap = dynamic(() => import('@/components/Map'), { 
  loading: () => <div className="h-64 w-full bg-gray-100 rounded-xl animate-pulse"></div>,
  ssr: false 
})

export default function RoomPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // Astuce: On récupère l'ID depuis l'URL manuellement pour éviter l'erreur de build
  const [roomId, setRoomId] = useState<string | null>(null)
  
  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    // On extrait l'ID de l'URL une fois côté client
    const path = window.location.pathname
    const id = path.split('/').pop()
    setRoomId(id || null)
  }, [])

  useEffect(() => {
    if (!roomId) return

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', roomId)
        .single()

      if (data) {
        setRoom({
          ...data,
          amenities: ['Wifi', 'Lave-linge', 'Cuisine'],
          host: { name: 'Hôte', avatar: 'https://i.pravatar.cc/150' },
          images: data.images || []
        })
      }
      setLoading(false)
    }
    fetchData()
  }, [roomId, supabase])

  const handleStartChat = async () => {
    if (!currentUser) return router.push('/login')
    if (!room) return

    if (currentUser.id === room.host_id) return alert("C'est votre propre annonce !")

    try {
      const { data: existingConvos } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', room.id)
        .eq('participant1_id', currentUser.id)
        .eq('participant2_id', room.host_id)
      
      if (existingConvos && existingConvos.length > 0) {
        alert(`Redirection vers le chat existant: ${existingConvos[0].id}`)
      } else {
        const { data: newConvo, error } = await supabase
          .from('conversations')
          .insert({
            listing_id: room.id,
            participant1_id: currentUser.id,
            participant2_id: room.host_id
          })
          .select()
          .single()

        if (error) throw error
        
        await supabase.from('messages').insert({
          conversation_id: newConvo.id,
          sender_id: currentUser.id,
          content: `Bonjour, je suis intéressé par votre logement "${room.title}". Est-il disponible ?`
        })

        alert("Demande envoyée à l'hôte !")
      }

    } catch (error: any) {
      console.error(error)
      alert("Erreur: " + error.message)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  if (!room) return <div className="min-h-screen flex items-center justify-center">Annonce introuvable.</div>

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="border-b border-gray-100 py-4 px-6 sticky top-0 bg-white z-50 flex items-center justify-between">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition">
           <span className="text-2xl">←</span>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        <h1 className="text-2xl font-bold mb-4">{room.title}</h1>
        
        <div className="h-[300px] md:h-[400px] w-full rounded-2xl overflow-hidden mb-8 bg-gray-200 relative">
          {room.images[0] && (
            <img src={room.images[0]} className="w-full h-full object-cover" alt="Main" />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_35%] gap-12">
          <div className="space-y-8">
             <div className="border-b border-gray-100 pb-6">
               <h2 className="text-xl font-bold mb-1">{room.location_name}</h2>
               <p className="text-gray-500">{room.type}</p>
             </div>
             <div>
               <p className="text-gray-600 leading-relaxed">{room.description}</p>
             </div>
          </div>

          <div className="relative">
             <div className="sticky top-32 border border-gray-200 shadow-xl rounded-xl p-6 bg-white">
                <div className="flex justify-between items-end mb-6">
                   <div>
                     <span className="text-2xl font-bold">${room.price_per_week}</span>
                     <span className="text-gray-500"> / semaine</span>
                   </div>
                </div>

                <button 
                  onClick={handleStartChat}
                  className="w-full bg-[#FF385C] hover:bg-[#d93250] text-white font-bold py-3.5 rounded-lg text-lg mb-4 transition"
                >
                  Discuter avec l'hôte
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
