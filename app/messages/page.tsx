'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type ConversationRow = {
  id: string
  created_at: string | null
  // selon ton schema: users peut être text[] / uuid[] / jsonb
  users: any
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

function safeArray(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.map(String)
  // si jsonb stocké en objet
  try {
    if (typeof val === 'string') {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed.map(String)
    }
  } catch {}
  return []
}

export default function MessagesPage() {
  const supabase = createClientComponentClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  const [messages, setMessages] = useState<MessageRow[]>([])
  const [draft, setDraft] = useState('')

  // 1) get user
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      setUserId(data.user?.id ?? null)
    })()
  }, [supabase])

  // 2) load conversations
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      setLoading(true)

      // ⚠️ Selon ton schema (users json/array), ce filtre peut varier.
      // Cas courant: users est un tableau (uuid[] / text[]) => .contains([userId])
      const { data, error } = await supabase
        .from('conversations')
        .select('id, created_at, users')
        .contains('users', [userId])
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('conversations error:', error)
        setConversations([])
        setLoading(false)
        return
      }

      const convos = (data ?? []) as ConversationRow[]
      setConversations(convos)

      // auto-select
      if (!activeConversationId && convos.length > 0) {
        setActiveConversationId(convos[0].id)
      }

      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // 3) load messages when active convo changes
  useEffect(() => {
    if (!userId || !activeConversationId) return
    ;(async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, created_at')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.warn('messages error:', error)
        setMessages([])
        return
      }

      setMessages((data ?? []) as MessageRow[])
    })()
  }, [userId, activeConversationId, supabase])

  // 4) realtime
  useEffect(() => {
    if (!activeConversationId) return

    const ch = supabase
      .channel(`messages:${activeConversationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversationId}` },
        async () => {
          const { data } = await supabase
            .from('messages')
            .select('id, conversation_id, sender_id, content, created_at')
            .eq('conversation_id', activeConversationId)
            .order('created_at', { ascending: true })

          setMessages((data ?? []) as MessageRow[])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [activeConversationId, supabase])

  const activeConvo = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  )

  const otherUserId = useMemo(() => {
    if (!activeConvo || !userId) return null
    const users = safeArray(activeConvo.users)
    return users.find((u) => u !== userId) ?? null
  }, [activeConvo, userId])

  const send = async () => {
    if (!userId || !activeConversationId) return
    const content = draft.trim()
    if (!content) return

    setDraft('')
    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConversationId,
      sender_id: userId,
      content,
    })

    if (error) {
      console.warn('send error:', error)
      setDraft(content) // restore
    }
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
        <div className="max-w-3xl mx-auto px-4 pt-10">
          <h1 className="text-2xl font-bold dark:text-white">Messages</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Connecte-toi pour accéder à la messagerie.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold dark:text-white">Messages</h1>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[55%]">
            {otherUserId ? `Conversation avec ${otherUserId}` : ''}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Conversations */}
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="font-semibold dark:text-white">Conversations</div>
            </div>

            {loading ? (
              <div className="p-4 text-gray-500 dark:text-gray-400">Chargement…</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-gray-500 dark:text-gray-400">
                Aucune conversation pour l’instant.
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto">
                {conversations.map((c) => {
                  const users = safeArray(c.users)
                  const other = users.find((u) => u !== userId) ?? 'Utilisateur'
                  const active = c.id === activeConversationId
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveConversationId(c.id)}
                      className={[
                        'w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800',
                        'hover:bg-gray-50 dark:hover:bg-gray-800 transition',
                        active ? 'bg-gray-50 dark:bg-gray-800' : '',
                      ].join(' ')}
                    >
                      <div className="font-semibold dark:text-white truncate">{other}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.id}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* Chat */}
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col min-h-[60vh]">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="font-semibold dark:text-white">Discussion</div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {!activeConversationId ? (
                <div className="text-gray-500 dark:text-gray-400">Sélectionne une conversation.</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400">Aucun message.</div>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_id === userId
                  return (
                    <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                      <div
                        className={[
                          'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                          mine
                            ? 'bg-rose-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                        ].join(' ')}
                      >
                        {m.content}
                        <div className={mine ? 'text-[10px] opacity-80 mt-1 text-right' : 'text-[10px] opacity-60 mt-1'}>
                          {new Date(m.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Écrire un message…"
                className="flex-1 rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none text-gray-900 dark:text-gray-100"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send()
                }}
              />
              <button
                onClick={send}
                className="px-5 py-3 rounded-2xl bg-rose-500 text-white font-semibold active:scale-95 transition"
              >
                Envoyer
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
