'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type ProfileRow = {
  id: string
  full_name: string | null
  avatar_url: string | null
  is_admin: boolean | null
  vip_active: boolean | null
  vip_until: string | null
  updated_at?: string | null
}

type VipPreset = 'off' | '7d' | '30d' | 'permanent'

function addDaysISO(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function formatVipUntil(vip_until: string | null) {
  if (!vip_until) return 'Permanent'
  const d = new Date(vip_until)
  if (Number.isNaN(d.getTime())) return vip_until
  return d.toLocaleString()
}

export default function AdminPage() {
  const supabase = useMemo(() => createClientComponentClient(), [])

  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authUserId, setAuthUserId] = useState<string | null>(null)

  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Load session + admin status
  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      setLoading(true)
      setErrorMsg(null)

      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (cancelled) return

      if (authErr) {
        setErrorMsg(authErr.message)
        setAuthUserId(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      const user = authData.user
      if (!user) {
        setAuthUserId(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setAuthUserId(user.id)

      // IMPORTANT: check admin on public.profiles (not profiles_public)
      const { data: me, error: meErr } = await supabase
        .from('profiles')
        .select('id,is_admin')
        .eq('id', user.id)
        .single()

      if (cancelled) return

      if (meErr) {
        setErrorMsg(meErr.message)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setIsAdmin(Boolean(me?.is_admin))
      setLoading(false)
    }

    boot()

    return () => {
      cancelled = true
    }
  }, [supabase])

  const loadProfiles = async () => {
    setErrorMsg(null)

    // Query profiles (admin-only update is handled by RLS policies)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, is_admin, vip_active, vip_until, updated_at')
      .order('updated_at', { ascending: false })
      .limit(200)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setProfiles((data as ProfileRow[]) || [])
  }

  // Load profiles list only if admin
  useEffect(() => {
    if (!loading && isAdmin) {
      loadProfiles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAdmin])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return profiles
    return profiles.filter((p) => {
      const name = (p.full_name || '').toLowerCase()
      const id = (p.id || '').toLowerCase()
      return name.includes(q) || id.includes(q)
    })
  }, [profiles, query])

  const setVip = async (profileId: string, preset: VipPreset) => {
    setErrorMsg(null)
    setSaving((s) => ({ ...s, [profileId]: true }))

    let vip_active = false
    let vip_until: string | null = null

    if (preset === 'off') {
      vip_active = false
      vip_until = null
    } else if (preset === 'permanent') {
      vip_active = true
      vip_until = null
    } else if (preset === '7d') {
      vip_active = true
      vip_until = addDaysISO(7)
    } else if (preset === '30d') {
      vip_active = true
      vip_until = addDaysISO(30)
    }

    const { error } = await supabase
      .from('profiles')
      .update({ vip_active, vip_until })
      .eq('id', profileId)

    if (error) {
      setErrorMsg(error.message)
      setSaving((s) => ({ ...s, [profileId]: false }))
      return
    }

    // optimistic refresh
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId ? { ...p, vip_active, vip_until } : p
      )
    )
    setSaving((s) => ({ ...s, [profileId]: false }))
  }

  const toggleAdminFlag = async (profileId: string, next: boolean) => {
    setErrorMsg(null)
    setSaving((s) => ({ ...s, [profileId]: true }))

    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: next })
      .eq('id', profileId)

    if (error) {
      setErrorMsg(error.message)
      setSaving((s) => ({ ...s, [profileId]: false }))
      return
    }

    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, is_admin: next } : p))
    )
    setSaving((s) => ({ ...s, [profileId]: false }))
  }

  // UI states
  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="mt-6 h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      </main>
    )
  }

  if (!authUserId) {
    return (
      <main className="min-h-screen bg-stone-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-gray-900 p-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Vous devez être connecté.</p>
        </div>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-stone-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-gray-900 p-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Accès refusé</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Votre compte n’a pas les droits administrateur.
          </p>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 break-all">
            <div>
              <span className="font-semibold">User ID:</span> {authUserId}
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {errorMsg}
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-gray-900 p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Administration</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Gérer VIP (et admins). Les règles Supabase empêchent les utilisateurs de se rendre VIP eux-mêmes.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadProfiles}
              className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-black/5 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white"
            >
              Rafraîchir
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-gray-900 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom ou ID…"
              className="w-full sm:max-w-lg px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {filtered.length} / {profiles.length}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {filtered.map((p) => {
            const busy = Boolean(saving[p.id])
            const vipLabel =
              p.vip_active && (!p.vip_until || new Date(p.vip_until) > new Date())
                ? `Actif (${formatVipUntil(p.vip_until)})`
                : 'Inactif'

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-gray-900 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden shrink-0">
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-gray-900 dark:text-white truncate">
                          {p.full_name || 'Sans nom'}
                        </div>
                        {p.is_admin ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                            ADMIN
                          </span>
                        ) : null}
                        {p.vip_active ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-200 border border-yellow-500/20">
                            VIP
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 break-all">{p.id}</div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        VIP: <span className="font-semibold">{vipLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 md:justify-end">
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={busy}
                        onClick={() => setVip(p.id, 'off')}
                        className="px-3 py-2 rounded-xl text-sm font-semibold border border-black/5 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                      >
                        VIP OFF
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => setVip(p.id, '7d')}
                        className="px-3 py-2 rounded-xl text-sm font-semibold border border-black/5 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                      >
                        VIP 7j
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => setVip(p.id, '30d')}
                        className="px-3 py-2 rounded-xl text-sm font-semibold border border-black/5 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                      >
                        VIP 30j
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => setVip(p.id, 'permanent')}
                        className="px-3 py-2 rounded-xl text-sm font-semibold border border-yellow-500/30 bg-yellow-500/15 text-yellow-200 disabled:opacity-50"
                      >
                        VIP Permanent
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        disabled={busy || p.id === authUserId}
                        onClick={() => toggleAdminFlag(p.id, !p.is_admin)}
                        className="px-3 py-2 rounded-xl text-sm font-semibold border border-black/5 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                        title={p.id === authUserId ? "Évite de te retirer admin ici" : "Basculer ADMIN"}
                      >
                        {p.is_admin ? 'Retirer ADMIN' : 'Rendre ADMIN'}
                      </button>
                    </div>
                  </div>
                </div>

                {busy && (
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Mise à jour…
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
          Note: si la liste est vide, vérifie que ta policy SELECT sur <code>profiles</code> autorise la lecture
          (ou adapte cette page pour lire <code>profiles_public</code>).
        </div>
      </div>
    </main>
  )
}