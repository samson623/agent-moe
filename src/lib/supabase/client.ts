/**
 * Browser-side Supabase client factory.
 *
 * Use `createClient()` in Client Components (`'use client'`).
 *
 * `createBrowserClient` from `@supabase/ssr` is singleton-safe — calling it
 * multiple times returns the same underlying client instance, so it is safe
 * to call at the top of any component without performance concerns.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Returns a typed Supabase client for use in Client Components.
 * Auth state is managed via cookies, kept in sync with the server client.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
