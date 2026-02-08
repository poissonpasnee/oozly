'use client'
import Link from 'next/link'

export default function EditProfile() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
      <Link href="/profile" className="text-2xl mb-6 block">← Retour</Link>
      <h1 className="text-3xl font-bold mb-6">Modifier le profil</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">Prénom</label>
          <input type="text" className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Bio</label>
          <textarea rows={4} className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent" placeholder="Parlez de vous..."></textarea>
        </div>
        <button type="button" className="w-full bg-black dark:bg-white dark:text-black text-white py-3 rounded-xl font-bold mt-4">Enregistrer</button>
      </form>
    </div>
  )
}
