import { createClient } from '@supabase/supabase-js'

// Read from environment variables injected at build time via Vite/CLI env
// For Vue CLI, we expect variables to be provided using process.env at build time
const SUPABASE_URL = process.env.VUE_APP_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VUE_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Fallback to avoid runtime crashes; developer will see console error in browser
  // You can set VUE_APP_SUPABASE_URL and VUE_APP_SUPABASE_ANON_KEY in .env.* at frontend root
  // Since backend/.env exists, copy values into frontend/.env.local when building locally
  // eslint-disable-next-line no-console
  console.error('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables')
}

export const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || ''
)

export default supabase


