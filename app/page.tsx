'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import dynamic from 'next/dynamic'
import ListingCard from '@/components/ListingCard'
import FiltersModal from '@/components/FiltersModal'
import Messages from '@/components/Messages'

const MapView = dynamic(() => import('@/components/Map'), {  
  loading: () => (
    <div className="h-full w-full bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center text-gray-400">
      Chargement...
    </div>
  ),
  ssr: false,
})

export default function Home() {
  const supabase = createClientComponentClient()
  
  // Listings
  const [allListings, setAllListings] = useState<any[]>([])
  const [filteredListings, setFilteredListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // User data (TOUTES tes tables)
  const [session, setSession] = useState<any>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [wishlists, setWishlists] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [userReviews, setUserReviews] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // UI states
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMessagesOpen, setIsMessagesOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // 1. FETCH LISTINGS + VIP (inchangé)
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error || !data) {
        setAllListings([])
        setFilteredListings([])
        setLoading(false)
        return
      }

      const formatted = data.map((item: any) => ({
        id: item.id,
        host_id: item.host_id,
        created_at: item.created_at,
        title: item.title,
        location: item.location_name,
        location_name: item.location_name,
        type: item.type,
        raw_type: item.type,
        price_per_week: item.price_per_week,
        bond: item.bond_amount || 0,
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

      // VIP hosts
      const hostIds = Array.from(new Set(formatted.map((l: any) => l.host_id).filter(Boolean))) as string[]
      let vipMap = new Map<string, boolean>()
      
      if (hostIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles_public')
          .select('id, vip_active, vip_until')
          .in('id', hostIds)

        const now = new Date()
        vipMap = new Map(
          (profiles || []).map((p: any) => {
            const untilOk = !p.vip_until || new Date(p.vip_until) > now
            return [p.id, Boolean(p.vip_active) && untilOk]
          })
        )
      }

      const sorted = [...formatted].sort((a: any, b: any) => {
        const aVip = vipMap.get(a.host_id!) ? 1 : 0
        const bVip = vipMap.get(b.host_id!) ? 1 : 0
        if (aVip !== bVip) return bVip - aVip
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      const enriched = sorted.map((l: any) => ({
        ...l,
        isVip: vipMap.get(l.host_id!) || false,
        typeLabel: l.type === 'private_room' ? 'Chambre privée' : 'Logement entier',
        // TES données utilisateur
        isFavorite: favorites.includes(l.id),
        userReservations: reservations.some((r: any) => r.listing_id === l.id),
        userReviews: userReviews.some((r: any) => r.listing_id === l.id),
      }))

      setAllListings(enriched)
      setFilteredListings(enriched)
      setLoading(false)
    }

    fetchListings()
  }, [supabase, favorites, reservations, userReviews])

  // 2. LOAD USER DATA (TOUTES tes tables)
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (!session?.user?.id) return

      // Favoris
      const { data: favData } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', session.user.id)
      setFavorites(favData?.map((f: any) => f.listing_id) || [])

      // Wishlists
      const { data: wlData } = await supabase
        .from('wishlists')
        .select('*')
        .eq('user_id', session.user.id)
      setWishlists(wlData || [])

      // Réservations
      const { data: resData } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', session.user.id)
      setReservations(resData || [])

      // Reviews utilisateur
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewer_id', session.user.id)
      setUserReviews(reviewData || [])

      // Conversations + unread
      const { data: convos } = await supabase
        .from('conversations')
        .select('*, messages(count)')
        .contains('users', [session.user.id])
      
      const unread = convos?.reduce((acc: number, convo: any) => {
        return acc + (convo.messages?.count || 0)
      }, 0) || 0
      
      setConversations(convos || [])
      setUnreadCount(unread)
    }

    loadUserData()
  }, [supabase])

  // Realtime sur conversations/messages
  useEffect(() => {
    if (!session?.user?.id) return

    const channel = supabase.channel('user-data')
    channel
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'favorites' 
      }, () => loadUserData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages' 
      }, () => loadUserData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session])

  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) {
      setFilteredListings(allListings)
    } else {
      const lowerTerm = searchTerm.toLowerCase()
      const filtered = allListings.filter(
        (l: any) =>
          (l.location || '').toLowerCase().includes(lowerTerm) ||
          (l.title || '').toLowerCase().includes(lowerTerm)
      )
      setFilteredListings(filtered)
    }
    setIsSearchOpen(false)
  }, [searchTerm, allListings])

  const applyFilters = useCallback((filters: any) => {
    const result = allListings.filter((l: any) => {
      if (l.price_per_week! > filters.maxPrice) return false
      if (filters.type !== 'any' && l.raw_type !== filters.type) return false
      if (filters.womenOnly && !l.women_only) return false
      if (filters.amenities?.length > 0) {
        const hasAll = filters.amenities.every((a: string) => l.amenities.includes(a))
        if (!hasAll) return false
      }
      // Dates...
      return true
    })
    setFilteredListings(result)
  }, [allListings])

  const toggleFavorite = async (listingId: string) => {
    if (!session?.user?.id) return

    const isFav = favorites.includes(listingId)
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', session.user.id).eq('listing_id', listingId)
    } else {
      await supabase.from('favorites').insert({
        user_id: session.user.id,
        listing_id: listingId
      })
    }
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {searchTerm ? searchTerm : 'Où aller ?'}
          </span>
        </div>
        <button onClick={() => setIsFiltersOpen(true)} className="p-3 border border-stone-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800">
          <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"/>
          </svg>
        </button>
        <button
          onClick={() => setIsMessagesOpen(true)}
          className="p-3 border border-stone-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 relative"
        >
          <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* MODALS */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[3000] p-4 animate-in slide-in-from-bottom-10 duration-200">
          <button onClick={() => setIsSearchOpen(false)} className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">✕</button>
          <div className="mt-16 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Recherche</h2>
            <input
              type="text" autoFocus placeholder="Ville, Quartier..."
              className="w-full p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-lg outline-none focus:ring-2 focus:ring-rose-500 text-gray-900 dark:text-white"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="w-full mt-8 bg-rose-500 text-white font-bold py-3.5 rounded-xl text-lg">Rechercher</button>
          </div>
        </div>
      )}

      <FiltersModal isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} onApply={applyFilters} />
      {isMessagesOpen && <Messages onClose={() => setIsMessagesOpen(false)} />}

      {/* LISTE ET CARTE */}
      <div className="flex-1 max-w-[1800px] mx-auto w-full px-4 lg:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_45%] gap-8">
          <div className="pb-20">
            <div className="flex justify-between items-end mb-4 px-1">
              <h2 className="font-semibold text-lg dark:text-white">
                {loading ? '...' : `${filteredListings.length} logements`}
              </h2>
              {(searchTerm || filteredListings.length !== allListings.length) && (
                <button onClick={() => {setSearchTerm(''); setFilteredListings(allListings)}} className="text-sm text-rose-500 font-medium underline">
                  Tout effacer
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"/>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
                {filteredListings.map((listing) => (
                  <ListingCard 
                    key={listing.id} 
                    data={listing}
                    isFavorite={favorites.includes(listing.id)}
                    onToggleFavorite={() => toggleFavorite(listing.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
            <div className="h-full w-full lg:rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700">
              <MapView listings={filteredListings} />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM TABS */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-700 z-50 px-4 py-3 flex justify-around items-center">
        <button className="flex flex-col items-center p-2 text-gray-700 dark:text-gray-300 active:scale-95 active:text-rose-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span className="text-xs mt-1">Accueil</span>
        </button>
        <button className="flex flex-col items-center p-2 text-rose-500 relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          <span className="text-xs mt-1">Carte</span>
        </button>
        <button 
          onClick={() => setIsMessagesOpen(true)}
          className="flex flex-col items-center p-2 text-gray-700 dark:text-gray-300 relative active:scale-95 active:text-rose-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
          <span className="text-xs mt-1">Messages</span>
        </button>
        <button className="flex flex-col items-center p-2 text-gray-700 dark:text-gray-300 active:scale-95 active:text-rose-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.5h3m-3 0H3m3 0v-3m0 3H5m5 0v-3m0 3H9m12-9V9m0 0H20m0 0l-3-3m3 3l3 3m0 0v3m0-3h-3m-6 0h-3m3 0v3m0-3h3"/>
          </svg>
          <span className="text-xs mt-1">Profil</span>
        </button>
      </div>
    </main>
  )
}
