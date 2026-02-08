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
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUser(user)
      else router.push('/login')
    }
    getUser()
    
    // Initialisation correcte du thème
    if (typeof window !== 'undefined') {
       const isDark = localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
       setIsDarkMode(isDark);
       if(isDark) document.documentElement.classList.add('dark');
       
       // Vérifier permission notif
       if ('Notification' in window && Notification.permission === 'granted') {
         setNotifEnabled(true);
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

  const toggleNotifications = async () => {
    if (!('Notification' in window)) {
      alert("Votre navigateur ne supporte pas les notifications.");
      return;
    }

    if (notifEnabled) {
      // On ne peut pas "révoquer" la permission via JS, juste désactiver l'état visuel
      setNotifEnabled(false);
      alert("Notifications désactivées pour cette session.");
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotifEnabled(true);
        new Notification("Notifications activées !", {
           body: "Vous serez alerté des nouveaux messages.",
           icon: "/icon.png" // Assurez-vous d'avoir une icone
        });
      } else {
        alert("Vous devez autoriser les notifications dans les paramètres de votre navigateur.");
      }
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!mounted) return null
  if (!user) return <div className="p-6">Chargement...</div>

  // bg-stone-50 pour le blanc chaleureux
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24 text-gray-900 dark:text-white transition-colors">
      <div className="px-6 py-8 max-w-lg mx-auto">
        
        {/* Header Profil */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 bg-gray-800 dark:bg-gray-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden border-4 border-white dark:border-gray-800">
             {/* Ici on pourrait mettre l'image de profil si elle existe */}
             {user.user_metadata?.avatar_url ? (
               <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" />
             ) : (
               user.email?.charAt(0).toUpperCase()
             )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mon Profil</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{user.email}</p>
            <Link href="/profile/edit" className="text-sm font-bold px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full hover:bg-rose-200 transition">
              Modifier
            </Link>
          </div>
        </div>

        {/* Settings Groups */}
        <div className="space-y-8">
          
          {/* Section: Préférences */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-gray-700">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Préférences</h2>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer" onClick={toggleDarkMode}>
               <div className="flex gap-3 items-center">
                 <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">🌙</div>
                 <span className="font-medium">Mode Sombre</span>
               </div>
               <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
                  <span className={`${isDarkMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
               </div>
            </div>

            <div className="flex justify-between items-center py-3 cursor-pointer pt-4" onClick={toggleNotifications}>
               <div className="flex gap-3 items-center">
                 <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">🔔</div>
                 <span className="font-medium">Notifications</span>
               </div>
               <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifEnabled ? 'bg-rose-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
                  <span className={`${notifEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
               </div>
            </div>
          </section>

          {/* Section: Compte & Sécurité (Nouveaux paramètres) */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-gray-700">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Compte</h2>
            
            {[
              { icon: '🔒', label: 'Connexion et sécurité', link: '/profile/security' },
              { icon: '💳', label: 'Paiements et versements', link: '/profile/payments' },
              { icon: '📄', label: 'Taxes et documents', link: '/profile/taxes' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer hover:opacity-70 transition">
                 <div className="flex gap-3 items-center">
                   <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">{item.icon}</div>
                   <span className="font-medium">{item.label}</span>
                 </div>
                 <span className="text-gray-400">›</span>
              </div>
            ))}
          </section>

          {/* Section: Support */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-gray-700">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Support</h2>
            
            <div className="flex justify-between items-center py-3 cursor-pointer hover:opacity-70 transition">
               <div className="flex gap-3 items-center">
                 <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">❓</div>
                 <span className="font-medium">Aide et support</span>
               </div>
               <span className="text-gray-400">›</span>
            </div>
            
             <div className="flex justify-between items-center py-3 border-t border-gray-100 dark:border-gray-700 cursor-pointer hover:opacity-70 transition" onClick={() => router.push('/admin')}>
               <div className="flex gap-3 items-center">
                 <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">🛡️</div>
                 <span className="font-medium">Portail Admin</span>
               </div>
               <span className="text-gray-400">›</span>
            </div>
          </section>

          <button 
            onClick={handleSignOut}
            className="w-full py-4 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
          >
            Déconnexion
          </button>
          
          <div className="text-center text-xs text-gray-400 pb-10">
            Version 1.2.0 • Oozly Inc.
          </div>
        </div>
      </div>
    </div>
  )
}
