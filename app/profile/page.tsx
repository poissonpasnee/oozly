'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  
  // État Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Charger user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUser(user)
      else router.push('/login')
    }
    getUser()
    
    // Charger préférence Dark Mode
    if (localStorage.getItem('theme') === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [supabase, router])

  // Fonction bascule Dark Mode
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

  if (!user) return <div className="p-6">Chargement...</div>

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24 text-gray-900 dark:text-white transition-colors">
      <div className="px-6 py-8">
        
        {/* Header Profil */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-gray-800 dark:bg-gray-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mon Profil</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
            <button className="text-sm font-semibold underline mt-1">Afficher le profil</button>
          </div>
        </div>

        {/* Bannière "Mettez votre logement sur Oozly" */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm mb-8 flex justify-between items-center">
           <div>
             <h3 className="font-bold text-sm">Mode Hôte</h3>
             <p className="text-xs text-gray-500 dark:text-gray-400">Louez votre chambre</p>
           </div>
           <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
              <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition"/>
           </div>
        </div>

        {/* Liste Paramètres */}
        <div className="space-y-6">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Préférences</h2>
          
          {/* Option: Dark Mode */}
          <div className="flex justify-between items-center py-2 cursor-pointer" onClick={toggleDarkMode}>
             <div className="flex gap-3 items-center">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700 dark:text-gray-300">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
               </svg>
               <span className="text-gray-700 dark:text-gray-300">Mode Sombre</span>
             </div>
             <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-black' : 'bg-gray-200'}`}>
                <span className={`${isDarkMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
             </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
             <div className="flex gap-3 items-center py-2 text-gray-700 dark:text-gray-300">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.795 23.91 23.91 0 01-1.014 5.795m-3.8-11.59a23.91 23.91 0 00-1.014 5.795 23.91 23.91 0 001.014 5.795m0 0a23.848 23.848 0 01-8.835 2.535" /></svg>
               <span>Langue et traduction</span>
             </div>
             <div className="flex gap-3 items-center py-2 text-gray-700 dark:text-gray-300 mt-2">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
               <span>Notifications</span>
             </div>
          </div>

          <button 
            onClick={handleSignOut}
            className="w-full mt-6 py-3 border border-black dark:border-white rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  )
}
