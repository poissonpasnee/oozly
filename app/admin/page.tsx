'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'listings'>('users')
  const [users, setUsers] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])

  useEffect(() => {
    checkAdmin()
    
    // ABONNEMENT TEMPS RÉEL (Modifications en direct)
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!data?.is_admin) return router.push('/')
    setIsAdmin(true)
    fetchData()
  }

  const fetchData = async () => {
    const { data: u } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const { data: l } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
    setUsers(u || [])
    setListings(l || [])
  }

  // ACTION : BANNIR UTILISATEUR (Supprime son profil, mais garde l'auth pour l'instant - idéalement faudrait bloquer l'auth via Edge Functions)
  const banUser = async (id: string) => {
    if(!confirm("Bannir cet utilisateur ? Ses annonces seront supprimées.")) return
    await supabase.from('listings').delete().eq('host_id', id) // Supprime ses annonces
    await supabase.from('profiles').delete().eq('id', id) // Supprime son profil
    alert("Utilisateur banni et données purgées.")
    fetchData()
  }

  const deleteListing = async (id: string) => {
    if(!confirm('Supprimer cette annonce ?')) return;
    await supabase.from('listings').delete().eq('id', id)
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20">
      <div className="bg-gray-800 text-white p-6 sticky top-0 z-10 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="font-bold text-xl">Admin Panel</h1>
          <div className="text-xs bg-green-500 px-2 py-1 rounded animate-pulse">Live</div>
        </div>
        <div className="flex mt-4 bg-gray-700 p-1 rounded-lg">
           <button onClick={() => setActiveTab('users')} className={`flex-1 py-2 rounded ${activeTab === 'users' ? 'bg-white text-gray-900' : 'text-gray-400'}`}>Users ({users.length})</button>
           <button onClick={() => setActiveTab('listings')} className={`flex-1 py-2 rounded ${activeTab === 'listings' ? 'bg-white text-gray-900' : 'text-gray-400'}`}>Listings ({listings.length})</button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'users' ? users.map(u => (
          <div key={u.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl flex justify-between items-center shadow-sm">
             <div>
               <div className="font-bold">{u.full_name || 'Inconnu'}</div>
               <div className="text-xs text-gray-500">{u.email}</div>
             </div>
             {!u.is_admin && (
               <button onClick={() => banUser(u.id)} className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">Bannir</button>
             )}
          </div>
        )) : listings.map(l => (
          <div key={l.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl flex gap-4 shadow-sm">
             <img src={l.images?.[0]} className="w-16 h-16 rounded bg-gray-200 object-cover" />
             <div className="flex-1">
               <div className="font-bold line-clamp-1">{l.title}</div>
               <div className="text-xs text-gray-500">${l.price_per_week} • {l.location_name}</div>
               <div className="mt-2 flex gap-2">
                 <button onClick={() => deleteListing(l.id)} className="text-xs text-red-500 font-bold">Supprimer</button>
                 <a href={`/listings/${l.id}`} target="_blank" className="text-xs text-blue-500 font-bold">Voir</a>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
