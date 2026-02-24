// lib/database.types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string
          title: string
          location_name: string | null
          lat: number | null
          lng: number | null
          price_per_week: number | null
          type: string | null
          women_only: boolean | null
          amenities: string[] | null
          availability_ranges: Json | null
          host_id: string | null
          images: string[] | null
          created_at: string
        }
      }
      profiles_public: {
        Row: {
          id: string
          vip_active: boolean
          vip_until: string | null
          // autres colonnes...
        }
      }
      conversations: {
        Row: {
          id: string
          users: string[]
          created_at: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
          read_by: string[] | null
        }
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          name: string
        }
      }
      'wishlist_items': {
        Row: {
          wishlist_id: string
          listing_id: string
        }
      }
      favorites: {
        Row: {
          user_id: string
          listing_id: string
          created_at: string
        }
      }
      reservations: {
        Row: {
          id: string
          listing_id: string
          user_id: string
          status: string
          dates: Json
        }
      }
      reviews: {
        Row: {
          id: string
          listing_id: string
          reviewer_id: string
          rating: number
          comment: string | null
        }
      }
      // + toutes tes autres tables...
    }
  }
}
