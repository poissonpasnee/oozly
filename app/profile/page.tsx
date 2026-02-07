'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUser(user)
      else router.push('/login')
    }
    getUser()
  }, [supabase, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return <div className="p-6">Chargement...</div>

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-6 py-8">
        
        {/* En-tête Profil */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Bonjour !</h1>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 py-4 space-y-6">
          
          {/* Section Paramètres */}
          <section>
            <h2 className="font-semibold text-lg mb-4">Paramètres du compte</h2>
            <div className="space-y-4">
               <div className="flex justify-between items-center py-2 cursor-pointer">
                 <div className="flex gap-3 items-center">
                   <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                   <span className="text-gray-700">Informations personnelles</span>
                 </div>
                 <span className="text-gray-400">›</span>
               </div>
               
               <div className="flex justify-between items-center py-2 cursor-pointer">
                 <div className="flex gap-3 items-center">
                   <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   <span className="text-gray-700">Paiements et versements</span>
                 </div>
                 <span className="text-gray-400">›</span>
               </div>
            </div>
          </section>

          {/* Bouton Déconnexion */}
          <button 
            onClick={handleSignOut}
            className="w-full mt-8 py-3 border border-black rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Se déconnecter
          </button>
          
          <div className="text-center mt-8 text-xs text-gray-400">
            Version Oozly 1.0 (Beta)
          </div>

        </div>
      </div>
    </div>
  )
}
