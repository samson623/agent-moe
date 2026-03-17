/**
 * Login page — the only public entry point for this private platform.
 *
 * Full-screen split layout:
 *  - Left panel: branding + operator team showcase
 *  - Right panel: auth form
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GoogleSignInButton } from './GoogleSignInButton'

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

const OPERATOR_TEAMS = [
  {
    icon: '⚡',
    name: 'Content Strike Team',
    desc: 'Generates and deploys content at scale',
  },
  {
    icon: '📈',
    name: 'Growth Operator',
    desc: 'Identifies and executes growth vectors',
  },
  {
    icon: '💰',
    name: 'Revenue Closer',
    desc: 'Converts leads and closes pipeline',
  },
  {
    icon: '🛡️',
    name: 'Brand Guardian',
    desc: 'Monitors and protects brand integrity',
  },
]

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, redirectTo } = await searchParams

  const errorMessage = decodeURIComponent(error ?? '')

  return (
    <div className="flex min-h-screen bg-[#080810]">
      {/* ------------------------------------------------------------------ */}
      {/* LEFT — Branding panel                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative hidden lg:flex lg:w-[55%] xl:w-[60%] flex-col overflow-hidden">
        {/* Mesh gradient background */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99,102,241,0.25) 0%, transparent 60%),
              radial-gradient(ellipse 60% 50% at 80% 80%, rgba(139,92,246,0.18) 0%, transparent 55%),
              radial-gradient(ellipse 50% 40% at 60% 40%, rgba(59,130,246,0.10) 0%, transparent 50%),
              #080810
            `,
          }}
        />

        {/* Grid overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 flex flex-col h-full px-16 py-14">
          {/* Wordmark */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-900/50">
              <span className="text-white font-bold text-base select-none">M</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">Agent Moe</span>
          </div>

          {/* Hero copy */}
          <div className="mb-16">
            <p className="text-indigo-400 text-sm font-medium tracking-widest uppercase mb-5">
              Private AI Operator Platform
            </p>
            <h1 className="text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
              Your AI team,<br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #60a5fa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                always on duty.
              </span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
              Four specialized AI operators executing content, growth, revenue, and brand strategy — autonomously, 24/7.
            </p>
          </div>

          {/* Operator team cards */}
          <div className="grid grid-cols-2 gap-3 mb-14">
            {OPERATOR_TEAMS.map((team) => (
              <div
                key={team.name}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 backdrop-blur-sm"
              >
                <div className="text-2xl mb-3">{team.icon}</div>
                <p className="text-white text-sm font-semibold mb-1">{team.name}</p>
                <p className="text-zinc-500 text-xs leading-relaxed">{team.desc}</p>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-zinc-700 text-xs">
            Access by invitation only · Private workspace
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT — Auth panel                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 bg-[#0d0d18] border-l border-white/[0.06]">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo (hidden on lg+) */}
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 mb-4">
              <span className="text-white font-bold text-lg select-none">M</span>
            </div>
            <h1 className="text-xl font-semibold text-white">Agent Moe</h1>
            <p className="text-sm text-zinc-500 mt-1">Private AI Operator Platform</p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
            <p className="text-zinc-500 text-sm mt-2">Sign in to your workspace to continue.</p>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3.5"
            >
              <span className="text-red-400 text-sm mt-0.5">⚠</span>
              <p className="text-sm text-red-400">
                {errorMessage === 'invalid_input'
                  ? 'Please enter a valid email and password.'
                  : errorMessage === 'google_sign_in_failed'
                    ? 'Google sign-in did not complete. Check the Supabase Google provider settings and try again.'
                    : errorMessage}
              </p>
            </div>
          )}

          {/* Google SSO */}
          <div className="mb-5">
            <GoogleSignInButton redirectTo={redirectTo || '/'} />
          </div>

          {/* Divider */}
          <div className="mb-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/[0.07]" />
            <span className="text-xs md:text-sm font-medium uppercase tracking-[0.15em] text-zinc-600">
              or email
            </span>
            <div className="h-px flex-1 bg-white/[0.07]" />
          </div>

          {/* Email / password form */}
          <form action={signIn} className="space-y-4">
            {redirectTo && (
              <input type="hidden" name="redirectTo" value={redirectTo} />
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-zinc-400 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-zinc-400 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 active:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors shadow-lg shadow-indigo-900/30"
            >
              Sign in
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-zinc-700 select-none">
            Private platform · Access by invitation only
          </p>
        </div>
      </div>
    </div>
  )
}
