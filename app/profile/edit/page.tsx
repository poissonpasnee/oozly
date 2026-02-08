'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditProfilePage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      
      setUserId(user.id)
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setFullName(data.full_name || '')
        setAvatarUrl(data.avatar_url || '')
      }
      setLoading(false)
    }
    getProfile()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })

    setLoading(false)
    if (error) {
      alert('Erreur: ' + error.message)
    } else {
      router.push('/profile')
      router.refresh()
    }
  }

  if (loading) return <div className="p-8 text-center">Chargement...</div>

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">←</Link>
        <h1 className="text-xl font-bold">Modifier le profil</h1>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        <div>
           <label className="block text-sm font-bold mb-2">Photo de profil (URL)</label>
           <input 
             type="text" 
             value={avatarUrl}
             onChange={(e) => setAvatarUrl(e.target.value)}
             className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
             placeholder="https://..."
           />
           {avatarUrl && <img src={avatarUrl} className="w-16 h-16 rounded-full mt-4 object-cover" />}
        </div>

        <div>
           <label className="block text-sm font-bold mb-2">Nom complet</label>
           <input 
             type="text" 
             value={fullName}
             onChange={(e) => setFullName(e.target.value)}
             className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
             placeholder="Votre nom"
           />
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl shadow-lg mt-8 active:scale-95 transition"
        >
          Enregistrer
        </button>
      </div>
    </div>
  )
}
