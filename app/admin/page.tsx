'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'listings'>('overview')
  
  const [users, setUsers] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])

  // Initialisation
  useEffect(() => {
    checkAdmin()
    
    // Live updates
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) {
      alert("Accès refusé.")
      router.push('/')
      return
    }
    setIsAdmin(true)
    fetchData()
  }

  const fetchData = async () => {
    setLoading(true)
    const { data: u } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const { data: l } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
    setUsers(u || [])
    setListings(l || [])
    setLoading(false)
  }

  const handleDeleteListing = async (id: string) => {
    if(!confirm("⚠️ Supprimer cette annonce définitivement ?")) return;
    await supabase.from('listings').delete().eq('id', id)
  }

  const handleBanUser = async (id: string) => {
    if(!confirm("⛔ BANNIR cet utilisateur ? (Irréversible)")) return;
    await supabase.from('profiles').delete().eq('id', id)
    // Note: Idéalement il faudrait aussi supprimer l'auth via une fonction serveur
    alert("Utilisateur supprimé de la base.")
  }

  if (!isAdmin) return null

  // --- COMPOSANTS INTERNES ---

  const StatCard = ({ label, value, color }: any) => (
    <div className={`p-4 rounded-2xl ${color} text-white shadow-lg flex flex-col justify-between h-24`}>
      <span className="text-xs font-bold opacity-80 uppercase">{label}</span>
      <span className="text-3xl font-extrabold">{value}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 text-gray-900 dark:text-white font-sans">
      
      {/* HEADER FIXE */}
      <div className="bg-white dark:bg-gray-800 px-6 pt-12 pb-4 shadow-sm sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-black">Admin</h1>
            <p className="text-xs text-green-500 font-bold flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Système opérationnel
            </p>
          </div>
          <Link href="/" className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">✕</Link>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
           {['overview', 'users', 'listings'].map((tab: any) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                 activeTab === tab ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-400'
               }`}
             >
               {tab === 'overview' ? 'Aperçu' : tab === 'users' ? 'Utilisateurs' : 'Annonces'}
             </button>
           ))}
        </div>
      </div>

      <div className="p-6">
        
        {/* VUE APERÇU */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-2 gap-4">
               <StatCard label="Utilisateurs" value={users.length} color="bg-blue-500" />
               <StatCard label="Annonces" value={listings.length} color="bg-violet-500" />
               <StatCard label="Revenus (Est.)" value="$12k" color="bg-emerald-500" />
               <StatCard label="Signalements" value="0" color="bg-orange-500" />
            </div>

            <h3 className="font-bold text-lg mt-8 mb-4">Dernières inscriptions</h3>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-4">
               {users.slice(0, 5).map(u => (
                 <div key={u.id} className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                       {u.avatar_url && <img src={u.avatar_url} className="w-full h-full object-cover"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="font-bold text-sm truncate">{u.full_name || 'Sans nom'}</div>
                       <div className="text-xs text-gray-500 truncate">{u.email}</div>
                    </div>
                    <div className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* VUE UTILISATEURS */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4">
            <input type="text" placeholder="Rechercher un utilisateur..." className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-none shadow-sm mb-4" />
            {users.map(u => (
              <div key={u.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                 <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center font-bold text-gray-500">
                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover rounded-full"/> : u.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                       <div className="font-bold text-sm truncate">{u.full_name || 'Utilisateur'}</div>
                       <div className="text-xs text-gray-500 truncate max-w-[150px]">{u.email}</div>
                       {u.is_admin && <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-bold">ADMIN</span>}
                    </div>
                 </div>
                 {!u.is_admin && (
                   <button onClick={() => handleBanUser(u.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                     🚫
                   </button>
                 )}
              </div>
            ))}
          </div>
        )}

        {/* VUE ANNONCES */}
        {activeTab === 'listings' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4">
            {listings.map(l => (
              <div key={l.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
                 <div className="flex p-3 gap-3">
                    <img src={l.images?.[0] || 'https://via.placeholder.com/100'} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                    <div className="flex-1 min-w-0 py-1">
                       <h4 className="font-bold text-sm truncate">{l.title}</h4>
                       <p className="text-xs text-gray-500 mt-1">{l.location_name}</p>
                       <p className="text-sm font-bold mt-1 text-rose-500">${l.price_per_week}<span className="text-xs text-gray-400 font-normal">/sem</span></p>
                    </div>
                 </div>
                 <div className="flex border-t border-gray-100 dark:border-gray-700 divide-x divide-gray-100 dark:divide-gray-700">
                    <a href={`/listings/${l.id}`} target="_blank" className="flex-1 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-700">
                       Voir
                    </a>
                    <button onClick={() => handleDeleteListing(l.id)} className="flex-1 py-3 text-center text-xs font-bold text-red-500 active:bg-red-50 dark:active:bg-red-900/20">
                       Supprimer
                    </button>
                 </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
