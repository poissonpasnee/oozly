'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false) // Basculer entre Connexion et Inscription
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      // Inscription
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (error) alert(error.message)
      else alert('Vérifiez votre email pour confirmer l\'inscription !')
    } else {
      // Connexion
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        alert('Erreur: ' + error.message)
      } else {
        router.push('/') // Redirection vers l'accueil une fois connecté
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header style Airbnb */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Bienvenue sur Oozly
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connectez-vous pour trouver votre colocation en Australie.
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 p-8 shadow-sm">
          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adresse e-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:border-rose-500 focus:outline-none focus:ring-rose-500 sm:text-sm"
                  placeholder="exemple@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:border-rose-500 focus:outline-none focus:ring-rose-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-[#FF385C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d93250] focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Chargement...' : (isSignUp ? "S'inscrire" : 'Continuer')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Ou</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="flex w-full justify-center rounded-lg border border-gray-800 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
              >
                {isSignUp ? "J'ai déjà un compte" : "Créer un compte"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
