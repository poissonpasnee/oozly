'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) router.replace('/')
    })()
  }, [router])

  const signIn = async () => {
    setMsg(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (error) {
      setMsg(error.message)
      return
    }

    if (data.session) {
      router.replace('/')
    } else {
      setMsg('Connexion OK, mais session absente. Vérifie tes variables NEXT_PUBLIC_SUPABASE_* au build.')
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setMsg('Déconnecté.')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5">
        <h1 className="text-xl font-extrabold">Login</h1>

        {msg && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm">
            {msg}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl bg-white/10 px-4 py-3 outline-none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="w-full rounded-xl bg-white/10 px-4 py-3 outline-none"
            placeholder="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button
            onClick={signIn}
            disabled={loading}
            className="w-full rounded-xl bg-rose-500 px-4 py-3 font-extrabold disabled:opacity-60"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

          <button
            onClick={signOut}
            className="w-full rounded-xl bg-white/10 px-4 py-3 font-bold"
          >
            Se déconnecter (test)
          </button>
        </div>
      </div>
    </main>
  )
}
