import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yafcbmyjjevmygwulupl.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZmNibXlqamV2bXlnd3VsdXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwOTk0ODUsImV4cCI6MjA4MDY3NTQ4NX0.3onnOvuTJYJE-qtOglB5krBHtf6U0cNu4P6KSGbJqRQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'oozly-auth',
  },
})
