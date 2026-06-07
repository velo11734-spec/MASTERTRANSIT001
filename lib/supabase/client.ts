import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseAnonKey
  )
}

// Singleton for client components
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseAnonKey
)

