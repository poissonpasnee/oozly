'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import dynamic from 'next/dynamic'
import ListingCard from '@/components/ListingCard'
import FiltersModal from '@/components/FiltersModal'

type ListingRow = {
  id: string
  host_id: string | null
  created_at: string
  title: string
  location_name: string | null
  type: string | null
  price_per_week: number | null
  bond_amount: number | null
  images: string[] | null
  lat: number | null
  lng: number | null
  amenities: string[] | null
  women_only: boolean | null
  availability_ranges: { start: string; end: string }[] | null
}

type ListingUI = {
  id: string
  host_id?: string
  created_at: string
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
  lat?: number
  lng?: number
  amenities: string[]
  women_only: boolean
  availability_ranges: { start: string; end: string }[]
  isVip: boolean
  typeLabel: string
}

type ProfilePublicRow = {
  id: string
  vip_active: boolean | null
  vip_until: string | null
}

const MapView = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center text-gray-400">
      Chargement…
    </div>
  ),
})

export default function Home() {
  const supabase = createClientComponentClient()

  const [allListings, setAllListings] = useState<ListingUI[]>([])
  const [filteredListings, setFilteredListings] = useState<ListingUI[]>([])
  const [loading, setLoading] = useState(true)

  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let mounted = true

    const fetchListings = async () => {
      setLoading(true)

      // PERF: pas de select('*')
      const { data, error } = await supabase
        .from('listings')
        .select(
          'id,host_id,created_at,title,location_name,type,price_per_week,bond_amount,images,lat,lng,amenities,women_only,availability_ranges'
        )
        .order('created_at', { ascending: false })
        .limit(200)

      if (!mounted) return

      if (error) {
        console.warn('listings error:', error)
        setAllListings([])
        setFilteredListings([])
        setLoading(false)
        return
      }

      const rows = (data || []) as ListingRow[]

      // 1) Format UI
      const formatted: ListingUI[] = rows.map((item) => {
        const hostId = item.host_id ?? undefined
        const locationName = item.location_name ?? 'Lieu inconnu'
        const rawType = item.type ?? 'private_room'

        return {
          id: item.id,
          host_id: hostId,
          created_at: item.created_at,
          title: item.title ?? '',
          location: locationName,
          location_name: locationName,
          type: rawType,
          raw_type: rawType,
          price_per_week: Number(item.price_per_week ?? 0),
          bond: Number(item.bond_amount ?? 0),
          rating: 4.9,
          reviews_count: 0,
          image: item.images?.[0] || '',
          dates: 'Disponible',
          is_superhost: false,
          lat: item.lat ?? undefined,
          lng: item.lng ?? undefined,
          amenities: item.amenities || [],
          women_only: Boolean(item.women_only),
          availability_ranges: item.availability_ranges || [],
          isVip: false,
          typeLabel: rawType === 'private_room' ? 'Chambre privée' : 'Logement entier',
        }
      })

      // 2) Charger VIP via profiles_public en 1 requête
      const hostIds = Array.from(
        new Set(formatted.map((l) => l.host_id).filter(Boolean))
      ) as string[]

      const vipByHost = new Map<string, boolean>()

      if (hostIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles_public')
          .select('id,vip_active,vip_until')
          .in('id', hostIds)

        if (profilesError) {
          console.warn('profiles_public error:', profilesError)
        } else {
          const now = new Date()
          ;((profiles || []) as ProfilePublicRow[]).forEach((p) => {
            const untilOk = !p.vip_until || new Date(p.vip_until).getTime() > now.getTime()
            const isVip = Boolean(p.vip_active) && untilOk
            vipByHost.set(p.id, isVip)
          })
        }
      }

      // 3) Enrich + tri (VIP d'abord puis created_at desc)
      const enriched = formatted.map((l) => ({
        ...l,
        isVip: l.host_id ? vipByHost.get(l.host_id) || false : false,
      }))

      enriched.sort((a, b) => {
        const aVip = a.isVip ? 1 : 0
        const bVip = b.isVip ? 1 : 0
        if (aVip !== bVip) return bVip - aVip
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      setAllListings(enriched)
      setFilteredListings(enriched)
      setLoading(false)
    }

    fetchListings()

    return () => {
      mounted = false
    }
  }, [supabase])

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredListings(allListings)
    } else {
      const lower = searchTerm.toLowerCase()
      const filtered = allListings.filter(
        (l) =>
          (l.location || '').toLowerCase().includes(lower) ||
          (l.title || '').toLowerCase().includes(lower)
      )
      setFilteredListings(filtered)
    }
    setIsSearchOpen(false)
  }

  // --- LOGIQUE DE FILTRAGE (DATES MULTIPLES) ---
  const applyFilters = (filters: any) => {
    const result = allListings.filter((l) => {
      // 1) Prix
      if (l.price_per_week > filters.maxPrice) return false

      // 2) Type
      if (filters.type !== 'any' && l.raw_type !== filters.type) return false

      // 3) Femmes uniquement
      if (filters.womenOnly && !l.women_only) return false

      // 4) Équipements
      if (filters.amenities?.length > 0) {
        const hasAll = filters.amenities.every((a: string) => l.amenities.includes(a))
        if (!hasAll) return false
      }

      // 5) Disponibilité (plages multiples)
      const ranges = l.availability_ranges

      // Pas de restriction = disponible
      if (!ranges || ranges.length === 0) return true

      const today = new Date().toISOString().split('T')[0]

      if (filters.availableNow) {
        const isFreeToday = ranges.some((r: any) => today >= r.start && today <= r.end)
        if (!isFreeToday) return false
      } else if (filters.targetDate) {
        const isFreeAtDate = ranges.some(
          (r: any) => filters.targetDate >= r.start && filters.targetDate <= r.end
        )
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
      <FiltersModal
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        onApply={applyFilters}
      />

      {/* LISTE ET CARTE (desktop) */}
      <div className="flex-1 max-w-[1800px] mx-auto w-full px-4 lg:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_45%] gap-8">
          {/* LISTINGS */}
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
                  <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
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

          {/* MAP (desktop seulement). Pour mobile: /map */}
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
