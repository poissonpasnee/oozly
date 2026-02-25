'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type ListingRow = {
  id: string
  host_id: string | null
  title: string
  description: string | null
  location_name: string | null
  price_per_week: number | null
  bond_amount: number | null
  type: string | null
  images: string[] | null
  amenities: string[] | null
  women_only: boolean | null
  couples_accepted: boolean | null
}

type HostPublicRow = {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
}

export default function ListingClient() {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const params = useSearchParams()
  const router = useRouter()

  const listingId = params.get('id')

  const [loading, setLoading] = useState(true)
  const [listing, setListing] = useState<ListingRow | null>(null)
  const [host, setHost] = useState<HostPublicRow | null>(null)
  const [me, setMe] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      setMe(data.session?.user?.id ?? null)
    })()
  }, [supabase])

  useEffect(() => {
    if (!listingId) {
      setErrorMsg('Annonce introuvable (id manquant).')
      setLoading(false)
      return
    }

    ;(async () => {
      setLoading(true)
      setErrorMsg(null)

      const { data: l, error } = await supabase
        .from('listings')
        .select(
          'id,host_id,title,description,location_name,price_per_week,bond_amount,type,images,amenities,women_only,couples_accepted'
        )
        .eq('id', listingId)
        .single()

      if (error || !l) {
        setErrorMsg(error?.message || 'Annonce introuvable.')
        setListing(null)
        setHost(null)
        setLoading(false)
        return
      }

      const row = l as ListingRow
      setListing(row)

      if (row.host_id) {
        const { data: p, error: pErr } = await supabase
          .from('profiles_public')
          .select('id,full_name,avatar_url,bio')
          .eq('id', row.host_id)
          .maybeSingle()

        if (pErr) console.warn('profiles_public error:', pErr)
        if (p) setHost(p as HostPublicRow)
      }

      setLoading(false)
    })()
  }, [supabase, listingId])

  const contactHost = async () => {
    if (!listing?.host_id) return

    if (!me) {
      router.push('/login')
      return
    }

    // ✅ ouvre (ou crée via RPC côté /messages) une conversation liée à l’annonce
    router.push(`/messages?to=${listing.host_id}&listing=${listing.id}`)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
        <div className="max-w-[1100px] mx-auto px-4 pt-6">
          <div className="h-10 w-60 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="mt-6 h-[320px] bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      </main>
    )
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
        <div className="max-w-[1100px] mx-auto px-4 pt-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
            {errorMsg || 'Annonce introuvable.'}
          </div>
          <Link href="/" className="inline-block mt-4 text-rose-500 underline font-semibold">
            Retour
          </Link>
        </div>
      </main>
    )
  }

  const image = listing.images?.[0] || 'https://via.placeholder.com/1200x800'

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
      <div className="max-w-[1100px] mx-auto px-4 pt-4">
        <Link href="/" className="text-sm font-semibold text-rose-500 underline">
          Retour
        </Link>

        <h1 className="mt-3 text-2xl font-extrabold text-gray-900 dark:text-white">{listing.title}</h1>

        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {listing.location_name || 'Lieu non précisé'}
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <img src={image} alt={listing.title} className="w-full h-[320px] object-cover" />
        </div>

        {/* ✅ Bloc hôte cliquable + bouton contacter */}
        {listing.host_id && (
          <div className="mt-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between gap-3">
              <Link href={`/profile/${listing.host_id}`} className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {host?.avatar_url ? (
                    <img src={host.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-black text-gray-500">
                      {host?.full_name?.[0]?.toUpperCase() || 'O'}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                    {host?.full_name ? `Hôte : ${host.full_name}` : 'Voir le profil'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {host?.bio || 'Clique pour voir le profil'}
                  </div>
                </div>
              </Link>

              <button
                onClick={contactHost}
                className="shrink-0 px-4 py-2 rounded-xl bg-rose-500 text-white font-extrabold active:scale-95 transition"
              >
                Contacter
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_340px] gap-4">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="text-sm font-extrabold text-gray-900 dark:text-white">Description</div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {listing.description || '—'}
            </p>

            {listing.amenities && listing.amenities.length > 0 && (
              <>
                <div className="mt-5 text-sm font-extrabold text-gray-900 dark:text-white">Équipements</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {listing.amenities.map((a) => (
                    <span
                      key={a}
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>

          <aside className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-end justify-between">
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                ${listing.price_per_week ?? 0}
              </div>
              <div className="text-sm text-gray-500">/ semaine</div>
            </div>

            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Caution : ${listing.bond_amount ?? 0}
            </div>

            <button
              onClick={contactHost}
              className="mt-4 w-full py-3 rounded-xl bg-rose-500 text-white font-extrabold active:scale-95 transition"
            >
              Envoyer un message
            </button>

            <div className="mt-3 text-xs text-gray-400">Conversation dédiée à cette annonce.</div>
          </aside>
        </div>
      </div>
    </main>
  )
}