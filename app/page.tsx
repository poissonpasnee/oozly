'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import dynamic from 'next/dynamic'
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

type AvailabilityRange = { start: string; end: string }

type ListingUI = {
  id: string
  host_id?: string // ✅ plus de null
  created_at?: string // ✅ plus de null
  title: string
  location: string
  location_name: string
  raw_type?: string
  type?: string
  price_per_week: number
  bond?: number
  rating: number
  reviews_count: number
  image: string
  dates: string
  is_superhost: boolean
  lat?: number
  lng?: number
  amenities: string[]
  women_only?: boolean
  availability_ranges: AvailabilityRange[]
  isVip: boolean
  typeLabel: string
  // garde l’ouverture à d’autres props (ListingCard accepte [key: string]: any)
  [key: string]: any
}

export default function Home() {
  const supabase = createClientComponentClient()

  const [allListings, setAllListings] = useState<ListingUI[]>([])
  const [filteredListings, setFilteredListings] = useState<ListingUI[]>([])
  const [loading, setLoading] = useState(true)

  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error || !data) {
        console.warn('listings error:', error)
        setAllListings([])
        setFilteredListings([])
        setLoading(false)
        return
      }

      // 1) Format de base (ne JAMAIS mettre null -> undefined)
      const formatted: ListingUI[] = data.map((item: any) => {
        const rawType: string | undefined = item.type ?? undefined

        return {
          id: String(item.id),

          host_id: item.host_id ?? undefined,
          created_at: item.created_at ?? undefined,

          title: item.title ? String(item.title) : '',
          location: item.location_name ? String(item.location_name) : 'Lieu inconnu',
          location_name: item.location_name ? String(item.location_name) : 'Lieu inconnu',

          raw_type: rawType,
          type: rawType,

          price_per_week: typeof item.price_per_week === 'number' ? item.price_per_week : 0,
          bond: typeof item.bond_amount === 'number' ? item.bond_amount : undefined,

          rating: 4.9,
          reviews_count: 0,

          image: item.images?.[0] ? String(item.images[0]) : '',
          dates: 'Disponible',
          is_superhost: false,

          lat: typeof item.lat === 'number' ? item.lat : undefined,
          lng: typeof item.lng === 'number' ? item.lng : undefined,

          amenities: Array.isArray(item.amenities) ? item.amenities : [],
          women_only: typeof item.women_only === 'boolean' ? item.women_only : undefined,
          availability_ranges: Array.isArray(item.availability_ranges) ? item.availability_ranges : [],

          isVip: false,
          typeLabel: rawType === 'private_room' ? 'Chambre privée' : 'Logement entier',
        }
      })

      // 2) VIP hosts via profiles_public
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
          const now = new Date().getTime()
          for (const p of profiles || []) {
            const id = String((p as any).id)
            const vip_active = Boolean((p as any).vip_active)

            const vip_until_raw = (p as any).vip_until as string | null | undefined
            const untilOk =
              !vip_until_raw || new Date(vip_until_raw).getTime() > now

            vipLookup[id] = vip_active && untilOk
          }
        }
      }

      // 3) Tri: VIP d'abord, puis created_at desc
      const sorted = [...formatted].sort((a, b) => {
        const aVip = a.host_id ? (vipLookup[a.host_id] ? 1 : 0) : 0
        const bVip = b.host_id ? (vipLookup[b.host_id] ? 1 : 0) : 0
        if (aVip !== bVip) return bVip - aVip

        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
        return bTime - aTime
      })

      // 4) Enrichir isVip
      const enriched: ListingUI[] = sorted.map((l) => ({
        ...l,
        isVip: l.host_id ? Boolean(vipLookup[l.host_id]) : false,
      }))

      setAllListings(enriched)
      setFilteredListings(enriched)
      setLoading(false)
    }

    fetchListings()
  }, [supabase])

  const handleSearch = () => {
    const term = searchTerm.trim().toLowerCase()

    if (!term) {
      setFilteredListings(allListings)
      setIsSearchOpen(false)
      return
    }

    const filtered = allListings.filter((l) => {
      const loc = (l.location || '').toLowerCase()
      const title = (l.title || '').toLowerCase()
      return loc.includes(term) || title.includes(term)
    })

    setFilteredListings(filtered)
    setIsSearchOpen(false)
  }

  // --- FILTRAGE (DATES MULTIPLES) ---
  const applyFilters = (filters: any) => {
    const result = allListings.filter((l) => {
      // 1) Prix
      if (typeof filters.maxPrice === 'number' && l.price_per_week > filters.maxPrice) return false

      // 2) Type
      if (filters.type !== 'any' && l.raw_type !== filters.type) return false

      // 3) Femmes uniquement
      if (filters.womenOnly && !l.women_only) return false

      // 4) Équipements
      if (Array.isArray(filters.amenities) && filters.amenities.length > 0) {
        const hasAll = filters.amenities.every((a: string) => l.amenities.includes(a))
        if (!hasAll) return false
      }

      // 5) Disponibilités
      const ranges = l.availability_ranges

      // Pas de restriction => dispo
      if (!ranges || ranges.length === 0) return true

      if (filters.availableNow) {
        const isFreeToday = ranges.some((r) => todayStr >= r.start && todayStr <= r.end)
        if (!isFreeToday) return false
      } else if (filters.targetDate) {
        const d = String(filters.targetDate)
        const isFreeAtDate = ranges.some((r) => d >= r.start && d <= r.end)
        if (!isFreeAtDate) return false
      }

      return true
    })

    setFilteredListings(result)
  }

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
              <h2 className="font-semibold text-lg dark:text-white">
                {loading ? '...' : filteredListings.length > 0 ? `${filteredListings.length} logements` : 'Aucun résultat'}
              </h2>

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
    </main>
  )
}
