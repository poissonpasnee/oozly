'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ListingCard from '@/components/ListingCard'
import FiltersModal from '@/components/FiltersModal'

const MapView = dynamic(() => import('@/components/Map'), {
  loading: () => (
    <div className="h-full w-full bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center text-gray-400">
      Chargement...
    </div>
  ),
  ssr: false,
})

type ListingRow = {
  id: string
  host_id?: string | null
  title?: string | null
  location_name?: string | null
  price_per_week?: number | null
  bond_amount?: number | null
  type?: string | null
  images?: string[] | null
  lat?: number | null
  lng?: number | null
  amenities?: string[] | null
  women_only?: boolean | null
  availability_ranges?: { start: string; end: string }[] | null
  created_at?: string | null
}

type UiListing = {
  id: string
  host_id?: string | null
  created_at?: string | null
  title: string
  location: string
  location_name: string
  type: string
  raw_type: string
  price_per_week: number
  bond: number
  rating: number
  reviews_count: number
  image: string
  dates: string
  is_superhost: boolean
  lat?: number | null
  lng?: number | null
  amenities: string[]
  women_only?: boolean | null
  availability_ranges: { start: string; end: string }[]
  isVip: boolean
}

function MessagesModal({
  onClose,
}: {
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[4000] bg-white dark:bg-gray-900 lg:hidden">
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="font-bold text-lg dark:text-white">Messages</div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>

      <div className="p-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            La messagerie (conversations + messages + realtime) arrive ici.
            <br />
            Pour l’instant, on garde l’UI intégrée proprement sans casser le build.
          </div>

          <div className="mt-4 flex gap-3">
            <Link
              href="/admin"
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              Admin
            </Link>
            <button
              onClick={onClose}
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-rose-500 text-white"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const supabase = createClientComponentClient()

  const [allListings, setAllListings] = useState<UiListing[]>([])
  const [filteredListings, setFilteredListings] = useState<UiListing[]>([])
  const [loading, setLoading] = useState(true)

  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isMessagesOpen, setIsMessagesOpen] = useState(false)

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('listings error:', error)
        setAllListings([])
        setFilteredListings([])
        setLoading(false)
        return
      }

      const rows = (data || []) as ListingRow[]

      const formatted: UiListing[] = rows.map((item) => ({
        id: item.id,
        host_id: item.host_id ?? null,
        created_at: item.created_at ?? null,
        title: item.title ?? '',
        location: item.location_name ?? '',
        location_name: item.location_name ?? '',
        type: item.type ?? 'private_room',
        raw_type: item.type ?? 'private_room',
        price_per_week: Number(item.price_per_week ?? 0),
        bond: Number(item.bond_amount ?? 0),
        rating: 4.9,
        reviews_count: 0,
        image: item.images?.[0] ?? '',
        dates: 'Disponible',
        is_superhost: false,
        lat: item.lat ?? null,
        lng: item.lng ?? null,
        amenities: item.amenities ?? [],
        women_only: item.women_only ?? false,
        availability_ranges: item.availability_ranges ?? [],
        isVip: false,
      }))

      // ---- VIP lookup via profiles_public (sans Map() pour éviter collision avec component Map) ----
      const hostIds = Array.from(
        new Set(formatted.map((l) => l.host_id).filter(Boolean))
      ) as string[]

      const vipLookup: Record<string, boolean> = {}

      if (hostIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles_public')
          .select('id, vip_active, vip_until')
          .in('id', hostIds)

        if (profilesError) {
          console.warn('profiles_public error:', profilesError)
        } else {
          const now = new Date()
          for (const p of profiles || []) {
            const untilOk = !p.vip_until || new Date(p.vip_until) > now
            vipLookup[p.id] = Boolean(p.vip_active) && untilOk
          }
        }
      }

      // Enrich + tri VIP d’abord, puis created_at DESC
      const enriched = formatted
        .map((l) => ({
          ...l,
          isVip: l.host_id ? Boolean(vipLookup[l.host_id]) : false,
        }))
        .sort((a, b) => {
          const aVip = a.isVip ? 1 : 0
          const bVip = b.isVip ? 1 : 0
          if (aVip !== bVip) return bVip - aVip

          const at = a.created_at ? new Date(a.created_at).getTime() : 0
          const bt = b.created_at ? new Date(b.created_at).getTime() : 0
          return bt - at
        })

      setAllListings(enriched)
      setFilteredListings(enriched)
      setLoading(false)
    }

    fetchListings()
  }, [supabase])

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredListings(allListings)
    } else {
      const lower = searchTerm.toLowerCase()
      setFilteredListings(
        allListings.filter(
          (l) =>
            (l.location || '').toLowerCase().includes(lower) ||
            (l.title || '').toLowerCase().includes(lower)
        )
      )
    }
    setIsSearchOpen(false)
  }

  // Filtrage (dates multiples) — identique à ton approche
  const applyFilters = (filters: any) => {
    const result = allListings.filter((l) => {
      if (l.price_per_week > filters.maxPrice) return false
      if (filters.type !== 'any' && l.raw_type !== filters.type) return false
      if (filters.womenOnly && !l.women_only) return false

      if (filters.amenities?.length > 0) {
        const hasAll = filters.amenities.every((a: string) => l.amenities.includes(a))
        if (!hasAll) return false
      }

      const ranges = l.availability_ranges
      if (!ranges || ranges.length === 0) return true

      const today = new Date().toISOString().split('T')[0]

      if (filters.availableNow) {
        const ok = ranges.some((r) => today >= r.start && today <= r.end)
        if (!ok) return false
      } else if (filters.targetDate) {
        const ok = ranges.some((r) => filters.targetDate >= r.start && filters.targetDate <= r.end)
        if (!ok) return false
      }

      return true
    })

    setFilteredListings(result)
  }

  const totalLabel = useMemo(() => {
    if (loading) return '...'
    if (filteredListings.length === 0) return 'Aucun résultat'
    return `${filteredListings.length} logements`
  }, [loading, filteredListings.length])

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24 transition-colors relative">
      {/* HEADER MOBILE */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md dark:bg-gray-900/90 z-40 px-4 py-3 shadow-sm flex gap-3 items-center lg:hidden transition-colors">
        <div
          onClick={() => setIsSearchOpen(true)}
          className="flex-1 bg-stone-100 dark:bg-gray-800 rounded-full flex items-center p-3 gap-3 active:scale-95 transition cursor-pointer"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {searchTerm ? searchTerm : 'Où aller ?'}
          </span>
        </div>

        <button
          onClick={() => setIsFiltersOpen(true)}
          className="p-3 border border-stone-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800"
          aria-label="Filtres"
        >
          <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
            />
          </svg>
        </button>
      </div>

      {/* MODAL RECHERCHE */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[3000] p-4 animate-in slide-in-from-bottom-10 duration-200">
          <button
            onClick={() => setIsSearchOpen(false)}
            className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            aria-label="Fermer"
          >
            ✕
          </button>
          <div className="mt-16 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Recherche</h2>
            <input
              type="text"
              autoFocus
              placeholder="Ville, Quartier..."
              className="w-full p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-lg outline-none focus:ring-2 focus:ring-rose-500 text-gray-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="w-full mt-8 bg-rose-500 text-white font-bold py-3.5 rounded-xl text-lg"
            >
              Rechercher
            </button>
          </div>
        </div>
      )}

      {/* FILTRES */}
      <FiltersModal isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} onApply={applyFilters} />

      {/* LISTE ET CARTE */}
      <div className="flex-1 max-w-[1800px] mx-auto w-full px-4 lg:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_45%] gap-8">
          <div className="pb-20">
            <div className="flex justify-between items-end mb-4 px-1">
              <h2 className="font-semibold text-lg dark:text-white">{totalLabel}</h2>

              {(searchTerm || filteredListings.length !== allListings.length) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilteredListings(allListings)
                  }}
                  className="text-sm text-rose-500 font-medium underline"
                >
                  Tout effacer
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
                {filteredListings.map((listing) => (
                  <ListingCard key={listing.id} data={listing} />
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
            <div className="h-full w-full lg:rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700 relative z-0">
              <MapView listings={filteredListings} />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL MESSAGES */}
      {isMessagesOpen && <MessagesModal onClose={() => setIsMessagesOpen(false)} />}

      {/* BOTTOM TABS (mobile) — Messages entre Carte et Profil */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-700 z-50 px-4 py-2 flex justify-around items-center">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center p-2 text-gray-700 dark:text-gray-300 active:text-rose-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" />
          </svg>
          <span className="text-xs mt-1">Accueil</span>
        </button>

        <button
          onClick={() => {
            const el = document.getElementById('map-section')
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          className="flex flex-col items-center p-2 text-gray-700 dark:text-gray-300 active:text-rose-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2m0 18l6-3m-6 3V2m6 15l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 2" />
          </svg>
          <span className="text-xs mt-1">Carte</span>
        </button>

        <button
          onClick={() => setIsMessagesOpen(true)}
          className="flex flex-col items-center p-2 text-gray-700 dark:text-gray-300 active:text-rose-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs mt-1">Messages</span>
        </button>

        <Link
          href="/profile"
          className="flex flex-col items-center p-2 text-gray-700 dark:text-gray-300 active:text-rose-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8z" />
          </svg>
          <span className="text-xs mt-1">Profil</span>
        </Link>
      </div>

      {/* Ancre carte (optionnel). Si tu veux la carte en mobile, mets un composant carte ici plus tard */}
      <div id="map-section" className="hidden" />
    </main>
  )
}
