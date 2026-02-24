'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Messages({ onClose }: { onClose: () => void }) {
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [currentConvo, setCurrentConvo] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // Load session + conversations
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      
      if (session?.user?.id) {
        await loadConversations()
      }
      setLoading(false)
    }
    init()
  }, [])

  const loadConversations = useCallback(async () => {
    if (!session?.user?.id) return

    const { data } = await supabase
      .from('conversations')
      .select(`
        id,
        users,
        messages (
          id, content, sender_id, created_at, read_by
          order: created_at
          limit: 1
        )
      `)
      .contains('users', [session.user.id])
      .order('messages.created_at', { ascending: false, referenced: true })

    setConversations(data || [])
  }, [session])

  const loadMessages = useCallback(async (convoId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true })
    
    setMessages(data || [])
    setCurrentConvo(convoId)
  }, [])

  const sendMessage = useCallback(async () => {
    const content = newMessage.trim()
    if (!currentConvo || !content || !session?.user?.id) return

    await supabase.from('messages').insert({
      conversation_id: currentConvo,
      sender_id: session.user.id,
      content
    })

    setNewMessage('')
    loadMessages(currentConvo)
  }, [currentConvo, newMessage, session])

  // Realtime
  useEffect(() => {
    if (!session?.user?.id) return

    const channel = supabase.channel('messages')
    channel
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${currentConvo}`
      }, (payload) => {
        loadMessages(currentConvo)
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations' 
      }, loadConversations)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [session, currentConvo])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[4000] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"/>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[4000] flex flex-col lg:hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
        <button onClick={onClose} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Conversations sidebar */}
        <div className="w-80 min-w-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <input 
              placeholder="Rechercher des conversations..." 
              className="w-full p-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>
          {conversations.map((convo: any) => {
            const otherUser = convo.users.find((id: string) => id !== session?.user?.id)
            const lastMsg = convo.messages?.[0]
            return (
              <div 
                key={convo.id}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-700 transition-colors ${
                  currentConvo === convo.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-rose-500' : ''
                }`}
                onClick={() => loadMessages(convo.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900 dark:text-white truncate min-w-0">{otherUser || 'Anonyme'}</div>
                  {lastMsg && (
                    <span className="text-xs text-gray-400 ml-2">{new Date(lastMsg.created_at).toLocaleTimeString()}</span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">{lastMsg?.content || 'Aucun message'}</div>
              </div>
            )
          })}
          {conversations.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Aucune conversation
              <div className="text-sm mt-2">Clique sur un logement pour envoyer un message</div>
            </div>
          )}
        </div>

        {/* Chat principal */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {currentConvo ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {conversations.find(c => c.id === currentConvo)?.users?.find((id: string) => id !== session?.user?.id)?.slice(0,2).toUpperCase()}
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white truncate">
                    {conversations.find(c => c.id === currentConvo)?.users?.find((id: string) => id !== session?.user?.id) || 'Anonyme'}
                  </div>
                  <div className="text-xs text-gray-500">En ligne</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      msg.sender_id === session?.user?.id 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      <div>{msg.content}</div>
                      <div className={`text-xs mt-1 opacity-75 ${
                        msg.sender_id === session?.user?.id ? 'text-rose-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky bottom-0">
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Tape ton message..."
                    className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white px-6 py-3 rounded-2xl font-semibold transition-colors disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8 text-center">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <h3 className="text-lg font-semibold mb-2">Aucune conversation sélectionnée</h3>
              <p className="text-sm">Clique sur une conversation pour commencer à discuter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
