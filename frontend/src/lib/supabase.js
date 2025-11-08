import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VUE_APP_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VUE_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {

  console.error('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables')
}

export const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || ''
)

export default supabase


