/**
 * Next.js Edge Middleware — Supabase session refresh + route protection.
 *
 * Responsibilities:
 *  1. Refresh the Supabase auth token on every request (keeps sessions alive).
 *  2. Redirect unauthenticated requests to /login.
 *  3. Redirect authenticated users away from /login to the dashboard.
 *
 * This is a private platform — every route requires authentication except:
 *  - /login
 *  - /api/health  (uptime monitoring, no auth needed)
 *  - Next.js internals (_next/static, _next/image, favicons, images)
 *
 * The matcher config at the bottom tells Next.js which paths this middleware
 * should run on — static assets are excluded for performance.
 */

import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'

/** Routes that are accessible without a session */
type CookieToSet = {
  name: string
  value: string
  options?: CookieOptions
}

const PUBLIC_ROUTES = [
  '/login',
  '/auth/callback',
  '/api/health',
  '/api/ai/health',
  '/api/ai/route-test',
  '/api/telegram/webhook',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

function buildForwardedHeaders(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  return requestHeaders
}

export async function middleware(request: NextRequest) {
  const requestHeaders = buildForwardedHeaders(request)

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          // First apply to the request so the server client can read them
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          // Rebuild the response so outgoing Set-Cookie headers include
          // the refreshed tokens
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Allow CLI / service-role access via Bearer token (e.g. from Claude Code)
  const authHeader = request.headers.get('authorization')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const isServiceAuth =
    serviceKey && authHeader === `Bearer ${serviceKey}`

  // IMPORTANT: Do not add any logic between createServerClient and
  // getUser(). A simple mistake will make it very hard to debug issues
  // with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith('/api/')

  if (!user && !isServiceAuth && !isPublicRoute(pathname)) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized - session expired. Please log in again.' },
        { status: 401 },
      )
    }
    // Not authenticated → send to login, preserving the intended destination
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && pathname === '/login') {
    // Already authenticated → send to dashboard
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/'
    dashboardUrl.searchParams.delete('redirectTo')
    return NextResponse.redirect(dashboardUrl)
  }

  // Return the supabaseResponse object as-is — it contains the refreshed
  // session cookies. Returning a different response would break auth.
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - any file with a common image/font/data extension
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot|mp4|webm|ogg|mp3|wav|pdf|csv|json)$).*)',
  ],
}
