'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [notifEnabled, setNotifEnabled] = useState(true)
  
  // NOUVEAU : État pour savoir si on est sur le client
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true) // On confirme qu'on est sur le navigateur
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUser(user)
      else router.push('/login')
    }
    getUser()
    
    // Check Dark Mode SAFE
    if (typeof window !== 'undefined') {
       if (localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark')) {
         setIsDarkMode(true)
         document.documentElement.classList.add('dark')
       }
    }
  }, [supabase, router])

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDarkMode(true)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // SI PAS MONTÉ, ON AFFICHE RIEN (Pour éviter le flash d'erreur)
  if (!mounted) return null
  
  if (!user) return <div className="p-6">Chargement...</div>

  return (
    // ... (Le reste du JSX reste identique à ce que je vous ai donné avant)
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24 text-gray-900 dark:text-white transition-colors">
      <div className="px-6 py-8">
        
        {/* Header Profil */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-gray-800 dark:bg-gray-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mon Profil</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{user.email}</p>
            <Link href="/profile/edit" className="text-sm font-semibold underline text-rose-500">
              Modifier mon profil
            </Link>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          <h2 className="font-semibold text-lg border-b border-gray-100 dark:border-gray-800 pb-2">Préférences</h2>
          
          {/* Dark Mode Switch */}
          <div className="flex justify-between items-center py-2 cursor-pointer" onClick={toggleDarkMode}>
             <div className="flex gap-3 items-center">
               <span>🌙 Mode Sombre</span>
             </div>
             <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-rose-500' : 'bg-gray-200'}`}>
                <span className={`${isDarkMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
             </div>
          </div>

          {/* Notifications Switch */}
          <div className="flex justify-between items-center py-2 cursor-pointer" onClick={() => setNotifEnabled(!notifEnabled)}>
             <div className="flex gap-3 items-center">
               <span>🔔 Notifications (Mobile)</span>
             </div>
             <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifEnabled ? 'bg-rose-500' : 'bg-gray-200'}`}>
                <span className={`${notifEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
             </div>
          </div>

          <button 
            onClick={handleSignOut}
            className="w-full mt-10 py-3 border border-red-200 text-red-500 rounded-lg font-bold hover:bg-red-50 transition"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  )
}
