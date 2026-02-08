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
    women_only
