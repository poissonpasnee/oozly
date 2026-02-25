'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseBrowser'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type ConversationStateRow = {
  conversation_id: string
  user_id: string
  last_read_at: string | null
  unread_count?: number | null
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

type ConversationPreview = {
  id: string
  lastMessage: MessageRow | null
  unread: number
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function MessagesClient() {

  const searchParams = useSearchParams()
  const toUserId = searchParams.get('to')
  const listingId = searchParams.get('listing')

  const [me, setMe] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [convos, setConvos] = useState<ConversationPreview[]>([])
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [text, setText] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement | null>(null)

  // GET USER
  const loadMe = async () => {
    const { data } = await supabase.auth.getSession()
    setMe(data.session?.user?.id ?? null)
  }

  // LOAD CONVERSATIONS
  const loadConversations = async (uid: string) => {

    const { data: states, error } = await supabase
      .from('conversation_states')
      .select('conversation_id,last_read_at,unread_count')
      .eq('user_id', uid)

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    if (!states || states.length === 0) {
      setConvos([])
      setLoading(false)
      return
    }

    const convoIds = states.map(s => s.conversation_id)

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', convoIds)
      .order('created_at', { ascending: false })

    const lastByConvo = new Map<string, MessageRow>()

    for (const m of msgs || []) {
      if (!lastByConvo.has(m.conversation_id)) {
        lastByConvo.set(m.conversation_id, m)
      }
    }

    const previews: ConversationPreview[] = convoIds.map(id => ({
      id,
      lastMessage: lastByConvo.get(id) || null,
      unread: states.find(s => s.conversation_id === id)?.unread_count || 0
    }))

    setConvos(previews)
    setLoading(false)

    if (!activeConvoId && previews.length > 0) {
      setActiveConvoId(previews[0].id)
    }
  }

  // LOAD MESSAGES
  const loadMessages = async (uid: string, convoId: string) => {

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true })

    setMessages(data || [])

    await supabase
      .from('conversation_states')
      .update({ last_read_at: new Date().toISOString(), unread_count: 0 })
      .eq('conversation_id', convoId)
      .eq('user_id', uid)
  }

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!me || !activeConvoId || !text.trim()) return

    await supabase.from('messages').insert({
      conversation_id: activeConvoId,
      sender_id: me,
      content: text
    })

    setText('')
    loadMessages(me, activeConvoId)
    loadConversations(me)
  }

  // INIT
  useEffect(() => { loadMe() }, [])

  useEffect(() => {
    if (me) loadConversations(me)
  }, [me])

  useEffect(() => {
    if (me && activeConvoId) loadMessages(me, activeConvoId)
  }, [activeConvoId])

  // AUTO CREATE CONVO FROM LISTING
  useEffect(() => {

    if (!me || !toUserId) return

    const start = async () => {

      const { data } = await supabase.rpc('find_or_create_conversation', {
        partner_id: toUserId,
        listing_id: listingId
      })

      if (data) {
        setActiveConvoId(data.conversation_id || data)
        loadConversations(me)
      }
    }

    start()

  }, [me, toUserId])

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">

      <div className="max-w-[1100px] mx-auto px-4 pt-4">

        <div className="flex justify-between">
          <h1 className="text-xl font-extrabold">Messages</h1>
          <Link href="/" className="text-rose-500 underline">Retour</Link>
        </div>

        {errorMsg && (
          <div className="mt-4 text-red-500">{errorMsg}</div>
        )}

        <div className="mt-4 grid md:grid-cols-[360px_1fr] gap-4">

          {/* CONVOS */}
          <div>
            {loading ? "Chargement..." : convos.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveConvoId(c.id)}
                className="block w-full text-left p-3 border-b"
              >
                {c.lastMessage?.content || "Conversation"}
                {c.unread > 0 && (
                  <span className="ml-2 text-red-500">{c.unread}</span>
                )}
              </button>
            ))}
          </div>

          {/* CHAT */}
          <div className="flex flex-col">

            <div className="flex-1 overflow-auto">
              {messages.map(m => (
                <div key={m.id} className={cn('p-2', m.sender_id === me ? 'text-right' : 'text-left')}>
                  {m.content}
                </div>
              ))}
            </div>

            <div className="flex gap-2 p-3">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                className="flex-1 bg-gray-200 rounded p-2"
              />
              <button onClick={sendMessage} className="bg-rose-500 text-white px-4 rounded">
                Envoyer
              </button>
            </div>

          </div>

        </div>

      </div>

    </main>
  )
}
