export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string
          host_id: string | null
          title: string | null
          location_name: string | null
          price_per_week: number | null
          bond_amount: number | null
          type: string | null
          images: string[] | null
          lat: number | null
          lng: number | null
          amenities: string[] | null
          women_only: boolean | null
          availability_ranges: { start: string; end: string }[] | null
          created_at: string | null
        }
        Insert: {
          id?: string
          host_id?: string | null
          title?: string | null
          location_name?: string | null
          price_per_week?: number | null
          bond_amount?: number | null
          type?: string | null
          images?: string[] | null
          lat?: number | null
          lng?: number | null
          amenities?: string[] | null
          women_only?: boolean | null
          availability_ranges?: { start: string; end: string }[] | null
          created_at?: string | null
        }
        Update: {
          id?: string
          host_id?: string | null
          title?: string | null
          location_name?: string | null
          price_per_week?: number | null
          bond_amount?: number | null
          type?: string | null
          images?: string[] | null
          lat?: number | null
          lng?: number | null
          amenities?: string[] | null
          women_only?: boolean | null
          availability_ranges?: { start: string; end: string }[] | null
          created_at?: string | null
        }
        Relationships: []
      }

      profiles_public: {
        Row: {
          id: string
          vip_active: boolean | null
          vip_until: string | null
          is_admin: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          vip_active?: boolean | null
          vip_until?: string | null
          is_admin?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          vip_active?: boolean | null
          vip_until?: string | null
          is_admin?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }

    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
