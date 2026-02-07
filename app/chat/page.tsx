'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

function ChatContent() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('id')
  const supabase = createClientComponentClient()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 1. Initialisation : Charger User + Messages
  useEffect(() => {
    if (!conversationId) return

    const fetchMessages = async () => {
      // Vérifier user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      // Charger historique
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
      setLoading(false)
    }

    fetchMessages()

    // 2. Abonnement Temps Réel (Supabase Realtime)
    const channel = supabase
      .channel('realtime messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        // Quand un nouveau message arrive, on l'ajoute à la liste
        setMessages((current) => [...current, payload.new])
      })
      .subscribe()

    // Nettoyage en quittant la page
    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase, router])

  // Scroll automatique en bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 3. Envoi Message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !userId || !conversationId) return

    const msgContent = newMessage
    setNewMessage('') // Reset input immédiat

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: msgContent
      })

    if (error) {
      alert('Erreur envoi: ' + error.message)
      setNewMessage(msgContent) // Remettre le texte si échec
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement de la discussion...</div>

  return (
    <div className="flex flex-col h-screen bg-white pb-20 lg:pb-0"> {/* Padding bottom pour mobile nav */}
      
      {/* HEADER FIXE */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 sticky top-0 bg-white z-10 shadow-sm">
        <Link href="/inbox" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h2 className="font-bold text-sm text-gray-900">Discussion</h2>
          <p className="text-xs text-green-600 font-medium">En ligne</p>
        </div>
      </div>

      {/* ZONE MESSAGES (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => {
          const isMe = msg.sender_id === userId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                  isMe 
                    ? 'bg-[#FF385C] text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          )
        })}
        {/* Ancre invisible pour le scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* ZONE INPUT (FIXE EN BAS) */}
      <form 
        onSubmit={sendMessage} 
        className="p-3 border-t border-gray-100 bg-white flex gap-2 items-center sticky bottom-[60px] lg:bottom-0 z-10"
      >
        <button type="button" className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
        
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez un message..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
        />
        
        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          className="p-3 bg-[#FF385C] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition hover:bg-[#d93250] shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </form>
    </div>
  )
}

// Wrapper Suspense obligatoire pour useSearchParams
export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Chargement...</div>}>
      <ChatContent />
    </Suspense>
  )
}
