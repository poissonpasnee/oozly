'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'

type ProfileRow = {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
}

export default function ProfileClient() {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const userId = params?.id

  const [me, setMe] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      setMe(data.session?.user?.id ?? null)
    })()
  }, [supabase])

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      setLoading(true)
      setErrorMsg(null)

      // ⚠️ adapte si tu utilises profiles_public
      const { data: p, error: pErr } = await supabase
        .from('profiles')
        .select('id,full_name,avatar_url,bio')
        .eq('id', userId)
        .maybeSingle()

      if (pErr || !p) {
        setErrorMsg(pErr?.message || 'Profil introuvable.')
        setProfile(null)
        setListings([])
        setLoading(false)
        return
      }

      setProfile(p as ProfileRow)

      const { data: l, error: lErr } = await supabase
        .from('listings')
        .select('*')
        .eq('host_id', userId)
        .order('created_at', { ascending: false })

      if (lErr) {
        setListings([])
      } else {
        // format minimal pour ListingCard si tu l’attends déjà comme sur Home
        const formatted = (l || []).map((item: any) => ({
          id: item.id,
          host_id: item.host_id,
          created_at: item.created_at,
          title: item.title,
          location: item.location_name,
          location_name: item.location_name,
          type: item.type,
          raw_type: item.type,
          price_per_week: item.price_per_week,
          bond: item.bond_amount,
          rating: 4.9,
          reviews_count: 0,
          image: item.images?.[0] || '',
          dates: 'Disponible',
          is_superhost: false,
          lat: item.lat,
          lng: item.lng,
          amenities: item.amenities || [],
          women_only: item.women_only,
          availability_ranges: item.availability_ranges || [],
        }))
        setListings(formatted)
      }

      setLoading(false)
    })()
  }, [supabase, userId])

  const contact = () => {
    if (!userId) return
    if (!me) {
      router.push('/login')
      return
    }
    router.push(`/messages?to=${userId}`)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
        <div className="max-w-[1100px] mx-auto px-4 pt-6">Chargement…</div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
        <div className="max-w-[1100px] mx-auto px-4 pt-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
            {errorMsg || 'Profil introuvable.'}
          </div>
          <Link href="/" className="inline-block mt-4 text-rose-500 underline font-semibold">
            Retour
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
      <div className="max-w-[1100px] mx-auto px-4 pt-4">
        <Link href="/" className="text-sm font-semibold text-rose-500 underline">
          Retour
        </Link>

        <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-black text-gray-500">
                    {profile.full_name?.[0]?.toUpperCase() || 'O'}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="text-xl font-extrabold text-gray-900 dark:text-white truncate">
                  {profile.full_name || 'Profil'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {profile.bio || '—'}
                </div>
              </div>
            </div>

            <button
              onClick={contact}
              className="shrink-0 px-4 py-2 rounded-xl bg-rose-500 text-white font-extrabold active:scale-95 transition"
            >
              Envoyer un message
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
            Annonces
          </h2>
          <div className="text-sm text-gray-500">{listings.length}</div>
        </div>

        {listings.length === 0 ? (
          <div className="mt-3 text-sm text-gray-500">Aucune annonce.</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
            {listings.map((l) => (
              <ListingCard key={l.id} data={l} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}