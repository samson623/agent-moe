/**
 * GET /api/health
 *
 * Public health-check endpoint — no authentication required.
 * Used by uptime monitors and the Command Center system health panel.
 *
 * Response shape:
 *   { status: 'ok', database: 'ok' | 'error', timestamp: string, version: string }
 *
 * HTTP status codes:
 *   200 — healthy (database may still report 'error' in the body)
 *   500 — unhandled server error
 *
 * We always return 200 and embed the database status in the body so uptime
 * monitors can distinguish a degraded-but-running state from a crash.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

/** Semantic version — keep in sync with package.json */
const VERSION = '0.1.0'

interface HealthResponse {
  status: 'ok'
  database: 'ok' | 'error'
  database_error?: string
  timestamp: string
  version: string
}

export const dynamic = 'force-dynamic' // never cache this endpoint

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const timestamp = new Date().toISOString()

  // Use the anon key — we just need to verify connectivity, not bypass RLS.
  // Creating a plain client (not the server/ssr client) is intentional here:
  // this route is cookie-free and we want the minimal possible surface area.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json<HealthResponse>(
      {
        status: 'ok',
        database: 'error',
        database_error: 'Supabase environment variables are not configured.',
        timestamp,
        version: VERSION,
      },
      { status: 200 },
    )
  }

  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })

    // Lightweight ping — count rows in a small system table.
    // `head: true` means we get only the count, no rows transferred.
    const { error } = await supabase
      .from('workspaces')
      .select('id', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json<HealthResponse>(
        {
          status: 'ok',
          database: 'error',
          database_error: error.message,
          timestamp,
          version: VERSION,
        },
        { status: 200 },
      )
    }

    return NextResponse.json<HealthResponse>(
      {
        status: 'ok',
        database: 'ok',
        timestamp,
        version: VERSION,
      },
      { status: 200 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    return NextResponse.json<HealthResponse>(
      {
        status: 'ok',
        database: 'error',
        database_error: message,
        timestamp,
        version: VERSION,
      },
      { status: 200 },
    )
  }
}
