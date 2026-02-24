export type Database = {
  public: {
    Tables: {
      listings: { Row: { id: string; host_id: string; title: string; location_name: string; price_per_week: number; type: string; images: string[]; lat: number; lng: number } }
      profiles_public: { Row:
