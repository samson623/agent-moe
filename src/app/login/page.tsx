/**
 * Login page — the only public entry point for this private platform.
 *
 * Uses a Server Action for form submission so we get:
 *  - Zero client-side JS for the auth flow
 *  - Proper cookie handling from the server
 *  - Type-safe redirect after successful login
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------

async function signIn(formData: FormData) {
  'use server'

  const email = formData.get('email')
  const password = formData.get('password')
  const redirectTo = formData.get('redirectTo')

  if (typeof email !== 'string' || typeof password !== 'string') {
    redirect('/login?error=invalid_input')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const params = new URLSearchParams({ error: error.message })
    if (typeof redirectTo === 'string' && redirectTo) {
      params.set('redirectTo', redirectTo)
    }
    redirect(`/login?${params.toString()}`)
  }

  // On success redirect to the originally requested route or the dashboard
  const destination =
    typeof redirectTo === 'string' && redirectTo && !redirectTo.startsWith('/login')
      ? redirectTo
      : '/'

  redirect(destination)
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

interface LoginPageProps {
  searchParams: Promise<{ error?: string; redirectTo?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, redirectTo } = await searchParams

  const errorMessage = decodeURIComponent(error ?? '')

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Subtle radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 mb-4">
            <span className="text-white font-bold text-xl select-none">M</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Agent Moe</h1>
          <p className="mt-1 text-sm text-zinc-500">Private AI Operator Platform</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-8 shadow-2xl">
          <h2 className="text-base font-medium text-zinc-100 mb-6">Sign in to your workspace</h2>

          {/* Error banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-400"
            >
              {errorMessage === 'invalid_input'
                ? 'Please enter a valid email and password.'
                : errorMessage}
            </div>
          )}

          <form action={signIn} className="space-y-4">
            {/* Hidden redirect passthrough */}
            {redirectTo && (
              <input type="hidden" name="redirectTo" value={redirectTo} />
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-zinc-400 mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="
                  w-full rounded-lg border border-zinc-700 bg-zinc-800/50
                  px-3.5 py-2.5 text-sm text-white placeholder-zinc-600
                  outline-none ring-0
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                  transition-colors
                "
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-zinc-400 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="
                  w-full rounded-lg border border-zinc-700 bg-zinc-800/50
                  px-3.5 py-2.5 text-sm text-white placeholder-zinc-600
                  outline-none ring-0
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                  transition-colors
                "
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="
                mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5
                text-sm font-semibold text-white
                hover:bg-indigo-500 active:bg-indigo-700
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                focus-visible:outline-indigo-500
                transition-colors
              "
            >
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-700 select-none">
          Private platform — access by invitation only
        </p>
      </div>
    </main>
  )
}
