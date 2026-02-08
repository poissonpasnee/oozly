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
  const [activeTab, setActiveTab] = useState<'users' | 'listings'>('users')
  
  const [users, setUsers] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])

  useEffect(() => {
    checkAdmin()
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
    const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const { data: listingsData } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
    
    setUsers(usersData || [])
    setListings(listingsData || [])
    setLoading(false)
  }

  const deleteListing = async (id: string) => {
    if(!confirm('Supprimer cette annonce définitivement ?')) return;
    await supabase.from('listings').delete().eq('id', id)
    fetchData() 
  }

  if (loading) return <div className="p-10 text-center dark:text-white">Chargement Admin...</div>
  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      
      {/* Header Admin */}
      <div className="bg-gray-900 text-white p-6 sticky top-0 z-10 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold mb-1">Panneau Administrateur</h1>
            <p className="text-xs text-gray-400">Gérez utilisateurs et contenus</p>
          </div>
          <Link href="/" className="text-xs bg-gray-700 px-2 py-1 rounded">Quitter</Link>
        </div>
        
        {/* Onglets */}
        <div className="flex mt-6 bg-gray-800 p-1 rounded-lg">
           <button 
             onClick={() => setActiveTab('users')}
             className={`flex-1 py-2 rounded-md text-sm font-bold transition ${activeTab === 'users' ? 'bg-white text-gray-900' : 'text-gray-400'}`}
           >
             Utilisateurs ({users.length})
           </button>
           <button 
             onClick={() => setActiveTab('listings')}
             className={`flex-1 py-2 rounded-md text-sm font-bold transition ${activeTab === 'listings' ? 'bg-white text-gray-900' : 'text-gray-400'}`}
           >
             Annonces ({listings.length})
           </button>
        </div>
      </div>

      <div className="p-4">
        
        {/* LISTE UTILISATEURS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {users.map(u => (
              <div key={u.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 overflow-hidden">
                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover"/> : (u.email?.charAt(0) || '?')}
                   </div>
                   <div>
                     <div className="font-bold text-sm text-gray-900 dark:text-white">{u.full_name || 'Sans nom'}</div>
                     <div className="text-xs text-gray-500">{u.email}</div>
                   </div>
                </div>
                {u.is_admin ? (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">Admin</span>
                ) : (
                  <button className="text-xs text-gray-400 border border-gray-200 dark:border-gray-600 px-2 py-1 rounded">User</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* LISTE ANNONCES */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            {listings.map(l => (
              <div key={l.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                 <div className="flex gap-3 mb-3">
                    <img src={l.images?.[0] || 'https://via.placeholder.com/50'} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                    <div className="flex-1">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{l.title}</h3>
                      <p className="text-xs text-gray-500">{l.location_name} • ${l.price_per_week}</p>
                    </div>
                 </div>
                 
                 <div className="flex gap-2 justify-end border-t border-gray-100 dark:border-gray-700 pt-3">
                    <button onClick={() => window.open(`/listings/${l.id}`)} className="text-xs font-bold px-3 py-2 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-lg">
                      Voir
                    </button>
                    <button onClick={() => deleteListing(l.id)} className="text-xs font-bold px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">
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
