'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Type pour une conversation
type Conversation = {
  id: string
  updated_at: string
  listing: {
    title: string
    images: string[]
  }
  other_user: {
    id: string
    email: string // On utilise l'email faute de nom dans la table auth
  }
  last_message: string
}

export default function InboxPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConversations = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // 1. Récupérer les convos brutes
      // Note: Supabase JS ne permet pas les jointures complexes facilement sans Views
      // On fait simple : on récupère tout et on filtre
      const { data: convos, error } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          listing_id,
          participant1_id,
          participant2_id,
          listings ( title, images )
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur chargement convos:', error)
      } else if (convos) {
        // 2. Formater pour l'affichage
        // Pour chaque convo, on doit savoir "qui est l'autre"
        const formatted = convos.map((c: any) => {
          const isMeParticipant1 = c.participant1_id === user.id
          const otherUserId = isMeParticipant1 ? c.participant2_id : c.participant1_id
          
          return {
            id: c.id,
            updated_at: new Date(c.created_at).toLocaleDateString(),
            listing: {
              title: c.listings?.title || 'Logement inconnu',
              images: c.listings?.images || []
            },
            other_user: { id: otherUserId, email: 'Utilisateur' }, // Simplifié
            last_message: 'Cliquez pour lire' // Idéalement on fetch le dernier msg
          }
        })
        setConversations(formatted)
      }
      setLoading(false)
    }

    fetchConversations()
  }, [supabase, router])

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>

      <div className="px-4 py-2">
        {loading ? (
          <div className="space-y-4 mt-4">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center mt-20 text-gray-500">
            <p className="mb-4">Aucun message pour le moment.</p>
            <Link href="/" className="text-rose-500 font-semibold underline">
              Explorer les logements
            </Link>
          </div>
        ) : (
          <div className="space-y-1 mt-2">
            {conversations.map((convo) => (
              <Link 
                key={convo.id} 
                href={`/inbox/${convo.id}`}
                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer border-b border-gray-50 last:border-0"
              >
                {/* Image du logement (Avatar) */}
                <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0 relative">
                  {convo.listing.images[0] ? (
                    <img src={convo.listing.images[0]} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">🏠</div>
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-semibold text-gray-900 truncate pr-2">
                        {convo.listing.title}
                      </h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{convo.updated_at}</span>
                   </div>
                   <p className="text-sm text-gray-600 truncate">
                      Conversation active
                   </p>
                   <p className="text-xs text-gray-400 mt-1">
                      Statut: En attente de réponse
                   </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
