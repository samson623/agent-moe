/**
 * Server-side Supabase client factory.
 *
 * Use `createClient()` in:
 *  - Server Components
 *  - Route Handlers (`app/api/...`)
 *  - Server Actions
 *
 * The client is created fresh on every call so it always picks up the latest
 * cookie values from the incoming request (Next.js `cookies()` is per-request).
 *
 * Cookie writes in a Server Component context are silently ignored — the
 * middleware handles token refresh and propagates the updated cookies back to
 * the browser. This is the recommended pattern from @supabase/ssr docs.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Creates a Supabase client bound to the current request's cookie store.
 * Respects Row Level Security — uses the anon key with the session from cookies.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Calling `set` from a Server Component throws.
            // The middleware will refresh the session and set the cookie there.
          }
        },
      },
    },
  )
}

/**
 * Creates a Supabase client that bypasses Row Level Security.
 * Uses the service role key — only call from trusted server contexts.
 *
 * NEVER expose this client to the browser or pass it to a Client Component.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Admin client cannot be created.',
    )
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
