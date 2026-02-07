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

  // 1. Charger les messages initiaux
  useEffect(() => {
    if (!conversationId) return

    const fetchMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
      setLoading(false)
    }

    fetchMessages()

    // 2. Écouter les nouveaux messages en TEMPS RÉEL (Magic!)
    const channel = supabase
      .channel('realtime messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages((current) => [...current, payload.new])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase, router])

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 3. Envoyer un message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !userId || !conversationId) return

    const msg = newMessage
    setNewMessage('') // Clear input direct pour fluidité

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: msg
      })

    if (error) alert('Erreur envoi: ' + error.message)
  }

  if (loading) return <div className="p-4 text-center text-gray-500">Chargement de la discussion...</div>

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <Link href="/inbox" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h2 className="font-bold text-sm">Discussion</h2>
          <p className="text-xs text-green-600">En ligne</p>
        </div>
      </div>

      {/* Liste des Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => {
          const isMe = msg.sender_id === userId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input Zone */}
      <form onSubmit={sendMessage} className="p-3 border-t border-gray-100 bg-white flex gap-2 items-center">
        <button type="button" className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez un message..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          className="p-2.5 bg-[#FF385C] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition hover:bg-[#d93250]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </form>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ChatContent />
    </Suspense>
  )
}
