{/* DANS app/layout.tsx - Remplacez l'ancien bloc <div className="lg:hidden fixed bottom-0..."> par ceci : */}

{showNav && (
  <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl shadow-2xl flex justify-around items-center py-4 px-2">
      
      {/* EXPLORER */}
      <Link href="/" className={`relative group flex flex-col items-center gap-1 w-14 transition-all ${activeTab === 'home' ? 'text-rose-500' : 'text-gray-400'}`}>
        <div className={`absolute -top-8 w-8 h-1 bg-rose-500 rounded-full transition-all duration-300 ${activeTab === 'home' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} />
        <svg className="w-6 h-6 transition-transform group-active:scale-90" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </Link>

      {/* FAVORIS */}
      <Link href="/favorites" className={`flex flex-col items-center gap-1 w-14 transition-all ${activeTab === 'favorites' ? 'text-rose-500' : 'text-gray-400'}`}>
        <svg className="w-6 h-6 transition-transform group-active:scale-90" fill={activeTab === 'favorites' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </Link>

      {/* BOUTON CENTRAL PUBLIER (Plus gros) */}
      <Link href="/publish" className="relative -top-6">
        <div className="w-14 h-14 bg-gradient-to-tr from-rose-500 to-pink-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-500/40 transform transition hover:scale-110 active:scale-95 border-4 border-white dark:border-gray-900">
           <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </div>
      </Link>

      {/* CARTE */}
      <Link href="/map" className={`flex flex-col items-center gap-1 w-14 transition-all ${activeTab === 'map' ? 'text-rose-500' : 'text-gray-400'}`}>
        <svg className="w-6 h-6 transition-transform group-active:scale-90" fill={activeTab === 'map' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      </Link>

      {/* PROFIL */}
      <Link href="/profile" className={`flex flex-col items-center gap-1 w-14 transition-all ${activeTab === 'profile' ? 'text-rose-500' : 'text-gray-400'}`}>
         <svg className="w-6 h-6 transition-transform group-active:scale-90" fill={activeTab === 'profile' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
         </svg>
      </Link>
    </div>
  </div>
)}
