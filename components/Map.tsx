'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Correction de l'icone par défaut de Leaflet qui bug souvent dans React
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

  return (
    <div className="h-[calc(100vh-160px)] w-full rounded-xl overflow-hidden shadow-inner border border-gray-200 sticky top-24">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // On cache le zoom moche par défaut pour le refaire si besoin
      >
        {/* Fond de carte style "Clair" (CartoDB Positron) qui ressemble bcp à Apple/Google Maps clean */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {listings.map((listing) => (
          <Marker 
            key={listing.id} 
            position={[listing.lat, listing.lng]} 
            icon={customIcon(listing.price_per_week)}
          >
            <Popup className="custom-popup">
              <div className="w-48 p-0 overflow-hidden">
                <img src={listing.image} alt={listing.title} className="w-full h-32 object-cover rounded-t-lg" />
                <div className="p-2">
                  <h3 className="font-bold text-sm truncate">{listing.title}</h3>
                  <p className="text-gray-500 text-xs">{listing.type} • {listing.beds} lits</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="font-bold text-gray-900">${listing.price_per_week}<span className="text-xs font-normal text-gray-500">/sem</span></span>
                    <span className="text-xs text-rose-500">★ {listing.rating}</span>
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
