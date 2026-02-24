// supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const SUPABASE_URL = "https://yafcbmyjjevmygwulupl.supabase.co";

// Clé anon (publique)
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZmNibXlqamV2bXlnd3VsdXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwOTk0ODUsImV4cCI6MjA4MDY3NTQ4NX0.3onnOvuTJYJE-qtOglB5krBHtf6U0cNu4P6KSGbJqRQ";

// Si tu utilises aussi une publishable key (selon ton setup)
export const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_rygPvDR-dtBWy9pTR8PoQg_QGvM4UF0";

// Supabase JS utilise l'anon key en général
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
