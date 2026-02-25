'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseBrowser'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

type ConvoPreview = {
  id: string
  last: string
  last_at: string | null
  unread: number
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function MessagesClient() {
  const searchParams = useSearchParams()
  const toUserId = searchParams.get('to') // UUID du profil à contacter
  const listingId = searchParams.get('listing') // optionnel

  const [me, setMe] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [convos, setConvos] = useState<ConvoPreview[]>([])
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null)

  const [messages, setMessages] = useState<MessageRow[]>([])
  const [text, setText] = useState('')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement | null>(null)

  const scrollBottom = () => {
    requestAnimationFrame(() => {
      if (!listRef.current) return
      listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }

  // -------------------------
  // AUTH
  // -------------------------
  const loadMe = async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      setErrorMsg(error.message)
      setMe(null)
      return
    }
    setMe(data.session?.user?.id ?? null)
  }

  // -------------------------
  // CONVERSATIONS
  // -------------------------
  const loadConversations = async (uid: string) => {
    setLoading(true)
    setErrorMsg(null)

    const { data: states, error: stErr } = await supabase
      .from('conversation_states')
      .select('conversation_id, unread_count, last_read_at')
      .eq('user_id', uid)

    if (stErr) {
      setErrorMsg(stErr.message)
      setConvos([])
      setLoading(false)
      return
    }

    const ids = (states || []).map((s: any) => s.conversation_id)

    if (ids.length === 0) {
      setConvos([])
      setLoading(false)
      return
    }

    // récupérer derniers messages
    const { data: lastMsgs, error: mErr } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at')
      .in('conversation_id', ids)
      .order('created_at', { ascending: false })
      .limit(500)

    if (mErr) {
      setErrorMsg(mErr.message)
    }

    const lastBy = new Map<string, { content: string; created_at: string }>()
    for (const m of lastMsgs || []) {
      if (!lastBy.has(m.conversation_id)) {
        lastBy.set(m.conversation_id, { content: m.content, created_at: m.created_at })
      }
    }

    const previews: ConvoPreview[] = ids.map((id: string) => {
      const s = (states || []).find((x: any) => x.conversation_id === id)
      const last = lastBy.get(id)
      return {
        id,
        last: last?.content || 'Conversation',
        last_at: last?.created_at || null,
        unread: Number(s?.unread_count || 0),
      }
    })

    previews.sort((a, b) => {
      const at = a.last_at ? new Date(a.last_at).getTime() : 0
      const bt = b.last_at ? new Date(b.last_at).getTime() : 0
      return bt - at
    })

    setConvos(previews)
    setLoading(false)

    if (!activeConvoId && previews.length > 0) {
      setActiveConvoId(previews[0].id)
    }
  }

  // -------------------------
  // MESSAGES
  // -------------------------
  const loadMessages = async (uid: string, convoId: string) => {
    setErrorMsg(null)

    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true })
      .limit(1000)

    if (error) {
      setErrorMsg(error.message)
      setMessages([])
      return
    }

    setMessages((data || []) as MessageRow[])

    // mark read
    await supabase
      .from('conversation_states')
      .update({ last_read_at: new Date().toISOString(), unread_count: 0 })
      .eq('conversation_id', convoId)
      .eq('user_id', uid)

    setConvos((prev) => prev.map((c) => (c.id === convoId ? { ...c, unread: 0 } : c)))
    scrollBottom()
  }

  // -------------------------
  // CREATE/OPEN from /messages?to=
  // -------------------------
  const openFromToParam = async (uid: string) => {
    if (!toUserId) return

    const { data, error } = await supabase.rpc('find_or_create_conversation', {
      partner_id: toUserId,
      listing_id: listingId || null,
    })

    if (error) {
      setErrorMsg(`RPC find_or_create_conversation: ${error.message}`)
      return
    }

    // data peut être [{conversation_id: "..."}] selon Supabase
    const cid =
      Array.isArray(data) ? (data[0] as any)?.conversation_id : (data as any)?.conversation_id ?? data

    if (!cid) {
      setErrorMsg('Impossible de récupérer conversation_id (RPC a renvoyé vide).')
      return
    }

    setActiveConvoId(cid)
    await loadConversations(uid)
    await loadMessages(uid, cid)
  }

  // -------------------------
  // SEND
  // -------------------------
  const sendMessage = async () => {
    setErrorMsg(null)

    if (!me) {
      setErrorMsg("Tu n'es pas connecté.")
      return
    }

    if (!activeConvoId) {
      // si on arrive depuis /messages?to=... et que le convo n'est pas encore créé
      await openFromToParam(me)
      if (!activeConvoId) {
        // activeConvoId sera mis via state, mais on peut re-check après RPC
      }
    }

    const content = text.trim()
    if (!content) return
    if (!activeConvoId) {
      setErrorMsg("Aucune conversation active (impossible d'envoyer).")
      return
    }

    setText('')

    const optimistic: MessageRow = {
      id: `optimistic-${Date.now()}`,
      conversation_id: activeConvoId,
      sender_id: me,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    scrollBottom()

    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConvoId,
      sender_id: me,
      content,
    })

    if (error) {
      setErrorMsg(error.message)
      // retirer l'optimistic si tu veux, ici on laisse simple
      return
    }

    await loadConversations(me)
  }

  // -------------------------
  // EFFECTS
  // -------------------------
  useEffect(() => {
    loadMe()

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadMe()
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!me) {
      setLoading(false)
      return
    }
    loadConversations(me)
  }, [me])

  useEffect(() => {
    if (!me || !activeConvoId) return
    loadMessages(me, activeConvoId)
  }, [me, activeConvoId])

  useEffect(() => {
    if (!me) return
    openFromToParam(me)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, toUserId, listingId])

  // realtime
  useEffect(() => {
    if (!me) return

    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as any as MessageRow

        // refresh list
        loadConversations(me)

        // si on est sur la conversation ouverte, append
        if (m.conversation_id === activeConvoId) {
          setMessages((prev) => [...prev, m])

          supabase
            .from('conversation_states')
            .update({ last_read_at: new Date().toISOString(), unread_count: 0 })
            .eq('conversation_id', m.conversation_id)
            .eq('user_id', me)

          scrollBottom()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [me, activeConvoId])

  // -------------------------
  // UI
  // -------------------------
  return (
    <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
      <div className="max-w-[1100px] mx-auto px-4 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-white">Messages</h1>
          <Link href="/" className="text-sm font-semibold text-rose-400 underline">
            Retour
          </Link>
        </div>

        {!me && (
          <div className="mt-4 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-200 px-4 py-3">
            Tu dois être connecté pour envoyer des messages. Va sur <Link className="underline" href="/login">Login</Link>.
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 text-red-200 px-4 py-3">
            {errorMsg}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-[360px_1fr] gap-4">
          {/* Conversations */}
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <div className="text-sm font-bold text-white">Conversations</div>
            </div>

            {loading ? (
              <div className="p-4 text-sm text-white/70">Chargement…</div>
            ) : convos.length === 0 ? (
              <div className="p-4 text-sm text-white/60">Aucune conversation.</div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto">
                {convos.map((c) => {
                  const active = c.id === activeConvoId
                  const time = c.last_at ? new Date(c.last_at).toLocaleString() : ''
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveConvoId(c.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition',
                        active && 'bg-rose-500/10'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-white truncate">Conversation</div>
                          <div className="text-xs text-white/70 truncate">{c.last}</div>
                          <div className="text-[11px] text-white/40 mt-1">{time}</div>
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
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex flex-col min-h-[70vh]">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="text-sm font-bold text-white">Chat</div>
              <button
                onClick={() => {
                  if (!me || !activeConvoId) return
                  loadMessages(me, activeConvoId)
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 text-white"
              >
                Rafraîchir
              </button>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {!activeConvoId ? (
                <div className="text-sm text-white/60">Sélectionne une conversation.</div>
              ) : messages.length === 0 ? (
                <div className="text-sm text-white/60">Aucun message.</div>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_id === me
                  return (
                    <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[78%] px-4 py-2 rounded-2xl text-sm leading-relaxed',
                          mine ? 'bg-rose-500 text-white' : 'bg-white/10 text-white'
                        )}
                      >
                        {m.content}
                        <div className={cn('text-[10px] mt-1 opacity-70')}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="border-t border-white/10 p-3">
              <div className="flex items-center gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Écrire un message…"
                  className="flex-1 bg-white/10 text-white rounded-2xl px-4 py-3 outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="px-5 py-3 rounded-2xl bg-rose-500 text-white font-extrabold active:scale-95 transition"
                >
                  Envoyer
                </button>
              </div>
              <div className="mt-2 text-[11px] text-white/40">
                Ouvrir depuis annonce/profil: <span className="font-mono">/messages?to=USER_UUID</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
