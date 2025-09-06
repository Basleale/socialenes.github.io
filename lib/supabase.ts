import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client-side Supabase client (singleton pattern)
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

// Server-side Supabase client
export const createServerClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Types for our database
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  last_seen?: string
  is_online?: boolean
}

export interface MediaItem {
  id: string
  user_id: string
  filename: string
  url: string
  type: string
  size: number
  created_at: string
  tags?: string[]
  likes_count?: number
  comments_count?: number
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  type: "text" | "voice"
  created_at: string
  read: boolean
}
