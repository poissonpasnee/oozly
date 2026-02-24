export default function Home() {
  return (
    <div style={{padding: '40px', fontFamily: 'Arial'}}>
      <h1 style={{color: '#e11d48', fontSize: '2.5rem'}}>
        🏠 Oozly - Colocation Australie
      </h1>
      <p style={{fontSize: '1.2rem', margin: '20px 0'}}>
        Ton site fonctionne ! Messagerie en cours d'ajout...
      </p>
      <div style={{background: '#fee2e2', padding: '20px', borderRadius: '12px'}}>
        <h2>✅ Fonctionnalités actives :</h2>
        <ul style={{margin: '10px 0'}}>
          <li>📍 Listings Supabase</li>
          <li>⭐ VIP profiles_public</li>
          <li>❤️ Favoris (favorites table)</li>
          <li>💬 Messagerie prête (conversations + messages)</li>
        </ul>
      </div>
      <div style={{marginTop: '30px', padding: '20px', background: '#dbeafe', borderRadius: '12px'}}>
        <h3>Prochaines étapes :</h3>
        <ol>
          <li>Messagerie avec realtime Supabase</li>
          <li>Carte interactive</li>
          <li>Filtres avancés</li>
          <li>Profil utilisateur VIP</li>
        </ol>
      </div>
    </div>
  )
}
