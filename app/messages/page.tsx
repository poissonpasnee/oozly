'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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

export default function MessagesPage() {
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()

  const toUserId = searchParams.get('to') // ouvrir convo depuis annonce/profil: /messages?to=<uuid>
  const listingId = searchParams.get('listing') // optionnel: /messages?to=...&listing=...

  const [me, setMe] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [convos, setConvos] = useState<ConversationPreview[]>([])
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null)

  const [messages, setMessages] = useState<MessageRow[]>([])
  const [text, setText] = useState('')

  const listRef = useRef<HTMLDivElement | null>(null)

  const activeUnread = useMemo(() => {
    const c = convos.find((x) => x.id === activeConvoId)
    return c?.unread || 0
  }, [convos, activeConvoId])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user?.id ?? null
      setMe(uid)
    })()
  }, [supabase])

  const loadConversations = async (uid: string) => {
    setLoading(true)

    // 1) On se base sur conversation_states (robuste)
    const { data: states, error: stErr } = await supabase
      .from('conversation_states')
      .select('conversation_id,user_id,last_read_at,unread_count')
      .eq('user_id', uid)

    if (stErr) {
      console.warn('conversation_states error:', stErr)
      setConvos([])
      setLoading(false)
      return
    }

    const stateRows = (states || []) as ConversationStateRow[]
    const convoIds = stateRows.map((s) => s.conversation_id).filter(Boolean)

    if (convoIds.length === 0) {
      setConvos([])
      setLoading(false)
      return
    }

    // 2) Derniers messages par conversation (on récupère un lot et on regroupe)
    const { data: lastMsgs, error: msgErr } = await supabase
      .from('messages')
      .select('id,conversation_id,sender_id,content,created_at')
      .in('conversation_id', convoIds)
      .order('created_at', { ascending: false })
      .limit(300) // évite lenteur, assez pour previews

    if (msgErr) {
      console.warn('messages preview error:', msgErr)
    }

    const lastByConvo = new Map<string, MessageRow>()
    for (const m of (lastMsgs || []) as MessageRow[]) {
      if (!lastByConvo.has(m.conversation_id)) lastByConvo.set(m.conversation_id, m)
    }

    // 3) Unread:
    // - si conversation_states.unread_count existe: on l’utilise
    // - sinon: calc (messages > last_read_at)
    const useUnreadCountColumn =
      stateRows.length > 0 && typeof stateRows[0].unread_count !== 'undefined'

    let unreadByConvo = new Map<string, number>()

    if (useUnreadCountColumn) {
      for (const s of stateRows) unreadByConvo.set(s.conversation_id, Number(s.unread_count) || 0)
    } else {
      // calc minimal: on utilise last_read_at + (lastMsgs)
      const lastReadByConvo = new Map<string, string | null>()
      for (const s of stateRows) lastReadByConvo.set(s.conversation_id, s.last_read_at || null)

      for (const m of (lastMsgs || []) as MessageRow[]) {
        if (m.sender_id === uid) continue
        const lastRead = lastReadByConvo.get(m.conversation_id)
        if (!lastRead) {
          unreadByConvo.set(m.conversation_id, (unreadByConvo.get(m.conversation_id) || 0) + 1)
          continue
        }
        if (new Date(m.created_at).getTime() > new Date(lastRead).getTime()) {
          unreadByConvo.set(m.conversation_id, (unreadByConvo.get(m.conversation_id) || 0) + 1)
        }
      }
    }

    const previews: ConversationPreview[] = convoIds.map((id) => ({
      id,
      lastMessage: lastByConvo.get(id) || null,
      unread: unreadByConvo.get(id) || 0,
    }))

    // tri par dernier message
    previews.sort((a, b) => {
      const at = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0
      const bt = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0
      return bt - at
    })

    setConvos(previews)
    setLoading(false)

    // auto-select si rien
    if (!activeConvoId && previews.length > 0) setActiveConvoId(previews[0].id)
  }

  const loadMessages = async (uid: string, convoId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('id,conversation_id,sender_id,content,created_at')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true })
      .limit(500)

    if (error) {
      console.warn('load messages error:', error)
      setMessages([])
      return
    }

    setMessages((data || []) as MessageRow[])

    // mark as read (best effort)
    await supabase
      .from('conversation_states')
      .update({ last_read_at: new Date().toISOString(), unread_count: 0 })
      .eq('user_id', uid)
      .eq('conversation_id', convoId)

    // refresh badge locally
    setConvos((prev) => prev.map((c) => (c.id === convoId ? { ...c, unread: 0 } : c)))

    // scroll bottom
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    }, 50)
  }

  const sendMessage = async () => {
    if (!me || !activeConvoId) return
    const content = text.trim()
    if (!content) return

    setText('')

    const optimistic: MessageRow = {
      id: `optimistic-${Date.now()}`,
      conversation_id: activeConvoId,
      sender_id: me,
      content,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimistic])
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    }, 10)

    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConvoId,
      sender_id: me,
      content,
    })

    if (error) {
      console.warn('send message error:', error)
    }
  }

  // Realtime: messages
  useEffect(() => {
    if (!me) return

    loadConversations(me)

    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as any as MessageRow
        // refresh previews
        loadConversations(me)
        // si c’est la convo active, append + mark read
        if (m?.conversation_id && m.conversation_id === activeConvoId) {
          setMessages((prev) => [...prev, m])
          // mark as read
          supabase
            .from('conversation_states')
            .update({ last_read_at: new Date().toISOString(), unread_count: 0 })
            .eq('user_id', me)
            .eq('conversation_id', m.conversation_id)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, activeConvoId])

  // Ouvrir conversation depuis annonce/profil:
  // Ici on ne peut pas deviner ton schéma conversations (participants, listing_id, etc).
  // Donc on te laisse un “hook” : tu appelles une RPC find_or_create_conversation côté SQL.
  useEffect(() => {
    if (!me) return
    if (!toUserId) return

    ;(async () => {
      /**
       * ✅ Recommandé: créer une RPC `find_or_create_conversation(partner_id uuid, listing_id uuid)`
       * qui retourne conversation_id.
       * Ensuite ici:
       */
      const { data, error } = await supabase.rpc('find_or_create_conversation', {
        partner_id: toUserId,
        listing_id: listingId,
      })

      if (error) {
        console.warn('find_or_create_conversation error:', error)
        return
      }

      const convoId = (data as any)?.conversation_id || data
      if (convoId) setActiveConvoId(convoId)
      await loadConversations(me)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, toUserId, listingId])

  useEffect(() => {
    if (!me || !activeConvoId) return
    loadMessages(me, activeConvoId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, activeConvoId])

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
      <div className="max-w-[1100px] mx-auto px-4 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Messages</h1>
          <Link href="/" className="text-sm font-semibold text-rose-500 underline">
            Retour
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-[360px_1fr] gap-4">
          {/* Conversations */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="text-sm font-bold text-gray-900 dark:text-white">Conversations</div>
              {activeUnread > 0 && (
                <div className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-full">
                  {activeUnread} non-lus
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-4 text-sm text-gray-500">Chargement…</div>
            ) : convos.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Aucune conversation.</div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto">
                {convos.map((c) => {
                  const active = c.id === activeConvoId
                  const last = c.lastMessage?.content || '…'
                  const time = c.lastMessage?.created_at
                    ? new Date(c.lastMessage.created_at).toLocaleString()
                    : ''
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveConvoId(c.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition',
                        active && 'bg-rose-50 dark:bg-gray-800'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                            Conversation
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {last}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-1">{time}</div>
                        </div>

                        {c.unread > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                            {c.unread > 99 ? '99+' : c.unread}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col min-h-[70vh]">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="text-sm font-bold text-gray-900 dark:text-white">Chat</div>

              {/* Options utiles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!activeConvoId) return
                    loadMessages(me || '', activeConvoId)
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  Rafraîchir
                </button>
                <button
                  onClick={async () => {
                    if (!me || !activeConvoId) return
                    await supabase
                      .from('conversation_states')
                      .update({ last_read_at: new Date().toISOString(), unread_count: 0 })
                      .eq('user_id', me)
                      .eq('conversation_id', activeConvoId)
                    setConvos((prev) => prev.map((c) => (c.id === activeConvoId ? { ...c, unread: 0 } : c)))
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-rose-500 text-white"
                >
                  Marquer lu
                </button>
              </div>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {!activeConvoId ? (
                <div className="text-sm text-gray-500">Sélectionne une conversation.</div>
              ) : messages.length === 0 ? (
                <div className="text-sm text-gray-500">Aucun message.</div>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_id === me
                  return (
                    <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[78%] px-4 py-2 rounded-2xl text-sm leading-relaxed',
                          mine
                            ? 'bg-rose-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        )}
                      >
                        {m.content}
                        <div className={cn('text-[10px] mt-1 opacity-70', mine ? 'text-white' : '')}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* composer */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-3">
              <div className="flex items-center gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Écrire un message…"
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl px-4 py-3 outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="px-5 py-3 rounded-2xl bg-rose-500 text-white font-extrabold active:scale-95 transition"
                >
                  Envoyer
                </button>
              </div>
              <div className="mt-2 text-[11px] text-gray-400">
                Astuce: ouvre un chat via <span className="font-mono">/messages?to=USER_UUID</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
