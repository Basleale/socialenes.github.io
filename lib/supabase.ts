import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for Supabase Auth
export interface SupabaseUser {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    display_name?: string
    avatar_url?: string
  }
  created_at: string
  last_sign_in_at?: string
}
