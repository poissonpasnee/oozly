'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function SecurityPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const updateEmail = async () => {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ email })
    setLoading(false)
    if (error) alert(error.message)
    else alert("Un email de confirmation a été envoyé à la nouvelle adresse.")
  }

  const updatePassword = async () => {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) alert(error.message)
    else alert("Mot de passe mis à jour avec succès !")
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-900 p-6">
      <div className="max-w-md mx-auto space-y-8">
        <h1 className="text-2xl font-bold mb-6">Connexion et Sécurité</h1>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
          <h2 className="font-bold mb-4">Changer d'email</h2>
          <input 
            type="email" placeholder="Nouvel email"
            className="w-full p-3 border rounded-lg mb-3 dark:bg-gray-700"
            onChange={e => setEmail(e.target.value)}
          />
          <button onClick={updateEmail} disabled={!email || loading} className="w-full py-2 bg-gray-900 text-white rounded-lg font-bold">Mettre à jour l'email</button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
          <h2 className="font-bold mb-4">Changer de mot de passe</h2>
          <input 
            type="password" placeholder="Nouveau mot de passe"
            className="w-full p-3 border rounded-lg mb-3 dark:bg-gray-700"
            onChange={e => setPassword(e.target.value)}
          />
          <button onClick={updatePassword} disabled={!password || loading} className="w-full py-2 bg-rose-500 text-white rounded-lg font-bold">Mettre à jour le mot de passe</button>
        </div>
        
        <button onClick={() => router.back()} className="text-gray-500 text-sm">Retour</button>
      </div>
    </div>
  )
}
