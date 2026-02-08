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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check Auth
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        setLoading(false)
      } else {
        router.push('/login')
      }
    })

    // Sync Dark Mode Button State
    if (typeof window !== 'undefined') {
       setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
  }, [supabase, router])

  // VRAI TOGGLE DARK MODE (Direct sur le DOM)
  const toggleDarkMode = () => {
    const html = document.documentElement
    if (html.classList.contains('dark')) {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDarkMode(false)
    } else {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDarkMode(true)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="p-8 text-center dark:text-white">Chargement du profil...</div>

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24 text-gray-900 dark:text-white transition-colors duration-300">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-gray-800 px-6 pt-12 pb-8 shadow-sm rounded-b-[2rem] mb-6">
        <div className="flex items-center gap-5">
           <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-orange-400 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden border-4 border-white dark:border-gray-700">
             {user.user_metadata?.avatar_url ? (
               <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" />
             ) : (
               user.email?.charAt(0).toUpperCase()
             )}
           </div>
           <div>
             <h1 className="text-2xl font-extrabold">{user.user_metadata?.full_name || 'Utilisateur'}</h1>
             <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
             <Link href="/profile/edit" className="text-xs font-bold text-rose-500 mt-1 inline-block">Modifier le profil ›</Link>
           </div>
        </div>
      </div>

      <div className="px-6 space-y-6 max-w-lg mx-auto">
        
        {/* PARAMÈTRES GÉNÉRAUX */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
           <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-pointer active:bg-gray-50 dark:active:bg-gray-700 transition" onClick={toggleDarkMode}>
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">🌙</div>
                 <span className="font-medium">Mode Sombre</span>
              </div>
              {/* Switch iOS Style */}
              <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
                 <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
           </div>

           <Link href="/profile/notifications" className="px-5 py-4 flex justify-between items-center cursor-pointer active:bg-gray-50 dark:active:bg-gray-700 transition">
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">🔔</div>
                 <span className="font-medium">Notifications</span>
              </div>
              <span className="text-gray-400">›</span>
           </Link>
        </section>

        {/* COMPTE & SÉCURITÉ */}
        <h3 className="text-xs font-bold text-gray-400 uppercase ml-2">Compte</h3>
        <section className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
           <Link href="/profile/security" className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-pointer active:bg-gray-50 dark:active:bg-gray-700 transition">
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">🔒</div>
                 <span className="font-medium">Connexion et sécurité</span>
              </div>
              <span className="text-gray-400">›</span>
           </Link>
           <Link href="/profile/payments" className="px-5 py-4 flex justify-between items-center cursor-pointer active:bg-gray-50 dark:active:bg-gray-700 transition">
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">💳</div>
                 <span className="font-medium">Paiements</span>
              </div>
              <span className="text-gray-400">›</span>
           </Link>
        </section>

        {/* SUPPORT & ADMIN */}
        <h3 className="text-xs font-bold text-gray-400 uppercase ml-2">Autres</h3>
        <section className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
           <Link href="/admin" className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-pointer active:bg-gray-50 dark:active:bg-gray-700 transition">
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">🛡️</div>
                 <span className="font-medium">Portail Administrateur</span>
              </div>
              <span className="text-gray-400">›</span>
           </Link>
           <button onClick={handleSignOut} className="w-full px-5 py-4 text-left text-red-500 font-bold active:bg-red-50 dark:active:bg-red-900/10 transition">
              Déconnexion
           </button>
        </section>

        <div className="text-center text-xs text-gray-400 pb-8">
           Oozly v2.0 • Fait avec ❤️ à Paris
        </div>
      </div>
    </div>
  )
}
