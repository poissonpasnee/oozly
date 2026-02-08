'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState } from 'react'

// Correction icônes Leaflet par défaut
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customIcon = (price: number) => L.divIcon({
  className: 'bg-transparent',
  html: `<div class="bg-white text-gray-900 font-bold px-3 py-1 rounded-full shadow-md border border-gray-200 hover:scale-110 hover:bg-gray-900 hover:text-white transition-all transform text-sm whitespace-nowrap">$${price}</div>`,
  iconSize: [50, 30],
  iconAnchor: [25, 15]
})

interface MapProps {
  listings: any[]
}

export default function Map({ listings }: MapProps) {
  // Coordonnées par défaut (Sydney)
  const defaultCenter: [number, number] = [-33.8688, 151.2093]
  
  // Filtrer les listings valides (ceux qui ont une lat et une lng)
  const validListings = listings.filter(l => 
    l.lat !== undefined && 
    l.lng !== undefined && 
    l.lat !== null && 
    l.lng !== null
  )

  // Utiliser un état pour être sûr qu'on est côté client (évite erreur hydratation)
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  if (!isMounted) return <div className="h-full w-full bg-gray-100 rounded-xl" />

  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-inner border border-gray-200 relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {validListings.map((listing) => (
          <Marker 
            key={listing.id} 
            position={[listing.lat, listing.lng]} 
            icon={customIcon(listing.price_per_week)}
          >
            <Popup className="custom-popup">
              <div className="w-48 p-0 overflow-hidden">
                <img src={listing.image || 'https://via.placeholder.com/300'} alt={listing.title} className="w-full h-32 object-cover rounded-t-lg" />
                <div className="p-2">
                  <h3 className="font-bold text-sm truncate">{listing.title}</h3>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="font-bold text-gray-900">${listing.price_per_week}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
