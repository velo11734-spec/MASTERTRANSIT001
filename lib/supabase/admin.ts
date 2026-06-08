import { createClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client using the SERVICE ROLE key.
 * 
 * ⚠️  NEVER expose this client on the frontend.
 * ⚠️  Only use in server-side API routes (app/api/**).
 * 
 * This client bypasses Row Level Security and should only be used for:
 * - Admin operations (approve/reject companies, process payouts, refunds)
 * - Webhook handlers (payment verification)
 * - Background jobs and cron operations
 * - Service-to-service calls
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY - add it to your environment variables')

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
