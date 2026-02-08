'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const AMENITIES_OPTIONS = [
  'Wifi', 'Climatisation', 'TV', 'Cuisine équipée', 
  'Lave-linge', 'Sèche-linge', 'Balcon', 'Terrasse', 
  'Jardin', 'Parking', 'Piscine', 'Ascenseur'
]

const CITIES = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Bondi Beach', 'Surry Hills', 'Newtown']

export default function PublishPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    bond: '',
    type: 'private_room',
    couples: false,
    women_only: false
  })
  
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const handleChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
    
    if (e.target.name === 'location') {
       if (value.length > 1) {
         setSuggestions(CITIES.filter(c => c.toLowerCase().includes(value.toLowerCase())))
       } else {
         setSuggestions([])
       }
    }
  }

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity))
    } else {
      setSelectedAmenities([...selectedAmenities, amenity])
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const {  { user } } = await supabase.auth.getUser()
    if (!user) { 
      router.push('/login') 
      setLoading(false)
      return 
    }

    const { error } = await supabase
      .from('listings')
      .insert({
        title: formData.title,
        description: formData.description,
        location_name: formData.location,
        price_per_week: parseInt(formData.price),
        bond_amount: parseInt(formData.bond),
        type: formData.type,
        couples_accepted: formData.couples,
        women_only: formData.women_only,
        amenities: selectedAmenities,
        images: imagePreview ? [imagePreview] : [],
        host_id: user.id,
        lat: -33.8688, 
        lng: 151.2093
      })

    if (error) {
      alert('Erreur: ' + error.message)
    } else {
      alert('Annonce publiée avec succès !')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24 text-gray-900 dark:text-white transition-colors">
      <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-50">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 font-bold">✕</Link>
        <h1 className="font-bold text-lg">Publier une annonce</h1>
        <div className="w-8"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8 max-w-lg mx-auto">
        <section>
          <h2 className="text-xl font-bold mb-4">Photos</h2>
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden">
             {imagePreview ? (
               <img src={imagePreview} className="w-full h-full object-cover" />
             ) : (
               <div className="text
