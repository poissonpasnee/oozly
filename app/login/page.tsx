// app/page.tsx
import SearchBar from '@/components/SearchBar'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Entête avec la barre de recherche */}
      <div className="border-b border-gray-100 py-6 px-4 sticky top-0 bg-white z-50">
        <SearchBar />
      </div>

      {/* Contenu temporaire en attendant la carte */}
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Logements à Sydney</h1>
        <p className="text-gray-500">La carte et les annonces apparaîtront ici.</p>
      </div>
    </main>
  )
}
