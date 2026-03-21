/**
 * LandingScreen — public landing page for MarinLoop.
 * Drop-in replacement for src/app/LandingScreen.tsx
 *
 * Requires: src/styles/landing.css imported in src/styles/index.css
 */
import { useEffect, useRef, useCallback, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/shared/stores/theme-store'
import { useAuthStore } from '@/shared/stores/auth-store'
import { IconButton } from '@/shared/components/IconButton'
import { Button } from '@/shared/components/ui'

// ─── Logo SVG (matches AppShell header) ──────────────────────────────────────

function LogoSvg({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 4h6l4 4v12H7z" />
      <path d="M9 13h6M9 17h4M13 4v4h4" />
    </svg>
  )
}

// ─── Scroll reveal hook ──────────────────────────────────────────────────────

function useScrollReveal() {
  const observed = useRef<Set<Element>>(new Set())

  const observe = useCallback((el: HTMLElement | null) => {
    if (!el || observed.current.has(el)) return
    observed.current.add(el)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible')
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    observed.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return observe
}

// ─── Product Preview (interactive mock) ──────────────────────────────────────

type MedStatus = 'taken' | 'upcoming'

interface MockMed {
  time: string
  name: string
  dose: string
  colorClass: string
  status: MedStatus
}

const INITIAL_MEDS: MockMed[] = [
  { time: '8:00 AM', name: 'Lisinopril', dose: '10mg · 1 tablet', colorClass: 'green', status: 'taken' },
  { time: '8:00 AM', name: 'Metformin', dose: '500mg · 1 tablet', colorClass: 'blue', status: 'taken' },
  { time: '12:00 PM', name: 'Vitamin D3', dose: '2000 IU · 1 softgel', colorClass: 'purple', status: 'upcoming' },
  { time: '9:00 PM', name: 'Melatonin', dose: '3mg · 1 tablet', colorClass: 'amber', status: 'upcoming' },
]

function ProductPreview() {
  const [meds, setMeds] = useState(INITIAL_MEDS)
  const taken = meds.filter((m) => m.status === 'taken').length
  const pct = Math.round((taken / meds.length) * 100)

  const toggle = (idx: number) => {
    setMeds((prev) =>
      prev.map((m, i) =>
        i === idx
          ? { ...m, status: m.status === 'taken' ? 'upcoming' : 'taken' }
          : m
      )
    )
  }

  return (
    <div className="landing-preview">
      <div className="landing-preview-frame">
        <div className="landing-preview-chrome">
          <div className="landing-pdot landing-pdot-r" />
          <div className="landing-pdot landing-pdot-y" />
          <div className="landing-pdot landing-pdot-g" />
          <div className="landing-purl">marinloop.com/timeline</div>
        </div>
        <div className="landing-preview-body">
          <div className="landing-mock">
            <div className="landing-mock-sidebar">
              <div className="landing-mock-sidebar-hdr">
                <span className="dot">&#9678;</span> MarinLoop
              </div>
              <div className="landing-mock-nav active">&#128339;&nbsp; Timeline</div>
              <div className="landing-mock-nav">&#128138;&nbsp; Medications</div>
              <div className="landing-mock-nav">&#128197;&nbsp; Appointments</div>
              <div className="landing-mock-nav">&#128200;&nbsp; Health</div>
              <div className="landing-mock-nav">&#128101;&nbsp; Care Network</div>
              <div className="landing-mock-nav">&#128100;&nbsp; Profile</div>
            </div>
            <div className="landing-mock-main">
              <div className="landing-mock-topbar">
                <h3>Today&apos;s Timeline</h3>
                <div className="dpill">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="landing-adh-bar">
                <div className="landing-adh-label">Today&apos;s Adherence</div>
                <div className="landing-adh-track">
                  <div
                    className="landing-adh-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="landing-adh-pct">{pct}%</div>
              </div>
              <div className="landing-med-list">
                {meds.map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    className="landing-med-card"
                    onClick={() => toggle(i)}
                    aria-label={`${m.name} — ${m.status === 'taken' ? 'Done' : 'Upcoming'}`}
                  >
                    <div className="landing-med-time">{m.time}</div>
                    <div className={`landing-med-icon ${m.colorClass}`}>&#128138;</div>
                    <div className="landing-med-info">
                      <div className="landing-med-name">{m.name}</div>
                      <div className="landing-med-dose">{m.dose}</div>
                    </div>
                    <div className={`landing-med-status ${m.status === 'taken' ? 'taken' : 'upcoming'}`}>
                      {m.status === 'taken' ? '✓ Done' : '⏰ Upcoming'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Feature Card ────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  iconBg,
  title,
  description,
  revealRef,
  className = '',
}: {
  icon: string
  iconBg: string
  title: string
  description: string
  revealRef: (el: HTMLElement | null) => void
  className?: string
}) {
  return (
    <div ref={revealRef} className={`landing-feature-card landing-reveal ${className}`}>
      <div className="landing-feature-icon" style={{ background: iconBg }}>
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

// ─── Trust Cell ──────────────────────────────────────────────────────────────

function TrustCell({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="landing-trust-cell">
      <div className="landing-trust-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function LandingScreen() {
  const { resolvedTheme, toggleTheme } = useThemeStore()
  const { session } = useAuthStore()
  const navigate = useNavigate()
  const reveal = useScrollReveal()

  // Redirect authenticated users
  if (session) return <Navigate to="/timeline" replace />

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* ── NAV ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-logo">
            <div className="landing-nav-icon">
              <LogoSvg />
            </div>
            <span className="font-extrabold tracking-[-0.02em] text-[var(--color-text-primary)]" style={{ fontSize: 'var(--text-subtitle)' }}>
              MarinLoop
            </span>
            <span className="shrink-0 rounded-md bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-inverse)] opacity-80 select-none">
              BETA
            </span>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#trust">Trust &amp; Safety</a>
          </div>
          <div className="landing-nav-right">
            <IconButton
              size="md"
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="!rounded-[10px] !border !border-[var(--color-border-primary)] !bg-[var(--color-bg-secondary)]"
            >
              {resolvedTheme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
              )}
            </IconButton>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/login')}
              className="!w-auto !min-w-0 !px-5 !py-2.5 !min-h-[40px] !rounded-[10px] !text-[var(--text-caption)]"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div ref={reveal} className="landing-hero-pill landing-reveal">
            <div className="landing-hero-pill-dot" />
            Open beta — free to use
          </div>
          <h1 ref={reveal} className="landing-reveal d1">
            Your medications,<br />
            <span className="highlight">on track every day.</span>
          </h1>
          <p ref={reveal} className="subtitle landing-reveal d2">
            Track doses, log vitals, coordinate with caregivers, and get timely
            reminders&nbsp;&mdash; all in one installable app that works offline.
          </p>
          <p ref={reveal} className="disclaimer landing-reveal d3">
            MarinLoop is a personal tracking and reminder tool. It is not a medical
            device, not for emergency use, and not offered in this beta for
            covered-entity workflows requiring HIPAA business associate agreements.
          </p>
          <div ref={reveal} className="landing-hero-buttons landing-reveal d4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/login')}
              className="!w-auto !min-w-[200px]"
            >
              Sign up free →
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/trust')}
              className="!w-auto !min-w-[200px]"
            >
              Review trust center
            </Button>
          </div>
        </div>
      </section>

      {/* ── PRODUCT PREVIEW ── */}
      <div ref={reveal} className="landing-reveal">
        <ProductPreview />
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="landing-section">
        <div className="landing-section-inner">
          <div ref={reveal} className="landing-section-label landing-reveal">Features</div>
          <h2 ref={reveal} className="landing-section-title landing-reveal d1">
            Everything you need to<br />stay on track.
          </h2>
          <p ref={reveal} className="landing-section-sub landing-reveal d2">
            Built for patients managing daily medications and caregivers who need
            visibility into routines.
          </p>
          <div className="landing-features-grid">
            <FeatureCard
              revealRef={reveal}
              icon="&#128339;"
              iconBg="var(--color-green-bg)"
              title="Daily Timeline"
              description="See every scheduled dose for the day with a live adherence ring. Tap to log, navigate between days, and track your progress over time."
            />
            <FeatureCard
              revealRef={reveal}
              className="d1"
              icon="&#128276;"
              iconBg="var(--color-amber-bg)"
              title="Push Reminders"
              description="Server-dispatched push notifications for doses and refills. Works even when the app is closed. Snooze or mark taken right from the notification."
            />
            <FeatureCard
              revealRef={reveal}
              className="d2"
              icon="&#128138;"
              iconBg="color-mix(in srgb, #7c3aed 8%, transparent)"
              title="Medication Management"
              description="Add medications manually or scan a label with AI. Track dosing schedules, refill quantities, supply levels, and discontinuation history."
            />
            <FeatureCard
              revealRef={reveal}
              className="d3"
              icon="&#128200;"
              iconBg="color-mix(in srgb, var(--color-accent) 8%, transparent)"
              title="Health Tracking"
              description="Log vitals (blood pressure, glucose, weight, heart rate), journal entries with mood, symptoms, and notes. Spot trends with visual charts."
            />
            <FeatureCard
              revealRef={reveal}
              className="d4"
              icon="&#128101;"
              iconBg="var(--color-red-bg)"
              title="Care Network"
              description="Add providers by specialty, invite caregivers with role-based access, and manage emergency contacts with a shareable ICE card and QR code."
            />
            <FeatureCard
              revealRef={reveal}
              className="d5"
              icon="&#129302;"
              iconBg="var(--color-accent-bg)"
              title="AI Assistant"
              description="Ask about interactions, side effects, or schedules. Scan prescription labels with your camera. All AI is opt-in, consent-gated, and runs server-side."
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="landing-section landing-steps-bg">
        <div className="landing-section-inner" style={{ textAlign: 'center' }}>
          <div ref={reveal} className="landing-section-label landing-reveal">How It Works</div>
          <h2 ref={reveal} className="landing-section-title landing-reveal d1" style={{ marginInline: 'auto' }}>
            Up and running in minutes.
          </h2>
          <p ref={reveal} className="landing-section-sub landing-reveal d2" style={{ marginInline: 'auto' }}>
            No app store download. No insurance forms. Works on any device.
          </p>
          <div className="landing-steps">
            <div ref={reveal} className="landing-step landing-reveal">
              <h3>Create your account</h3>
              <p>
                Sign up with email or Google. Accept the beta terms, choose your
                AI preferences, and add MarinLoop to your home screen.
              </p>
            </div>
            <div ref={reveal} className="landing-step landing-reveal d1">
              <h3>Add your medications</h3>
              <p>
                Enter medications manually or scan a prescription label. Set doses,
                times, quantities, and reminder preferences.
              </p>
            </div>
            <div ref={reveal} className="landing-step landing-reveal d2">
              <h3>Build your daily routine</h3>
              <p>
                Log doses on the timeline, track vitals and journal entries, invite
                caregivers, and let push reminders keep you on schedule.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST & SAFETY ── */}
      <section id="trust" className="landing-section landing-trust-bg">
        <div className="landing-section-inner">
          <div ref={reveal} className="landing-section-label landing-reveal">Trust &amp; Safety</div>
          <h2 ref={reveal} className="landing-section-title landing-reveal d1">
            Built with clear boundaries.
          </h2>
          <p ref={reveal} className="landing-section-sub landing-reveal d2">
            We tell you exactly what MarinLoop is&nbsp;&mdash; and what it isn&apos;t.
          </p>
          <div ref={reveal} className="landing-trust-grid landing-reveal d3">
            <TrustCell
              icon="✅"
              title="What MarinLoop Is"
              text="A personal medication-management workflow for reminders, adherence tracking, vitals logging, and caregiver coordination."
            />
            <TrustCell
              icon="❌"
              title="What It Is Not"
              text="Not a diagnostic tool, not a clinician substitute, not an emergency alerting system, and not a HIPAA deployment for covered-entity workflows in this beta."
            />
            <TrustCell
              icon="🤖"
              title="Optional AI"
              text="AI features are opt-in and revocable. Core medication tracking, reminders, and adherence work without AI enabled."
            />
            <TrustCell
              icon="🔒"
              title="Row-Level Security"
              text="Your data is isolated at the database level with Supabase RLS. No other user can access your records."
            />
            <TrustCell
              icon="📦"
              title="Data Portability"
              text="Export all your health data as JSON or delete your account and data entirely — anytime, from your profile."
            />
            <TrustCell
              icon="📜"
              title="In-App Legal"
              text="Terms of service, privacy policy, and trust center are accessible inside the app with consent gating on first use."
            />
          </div>
        </div>
      </section>

      {/* ── UNDER THE HOOD ── */}
      <section className="landing-section">
        <div className="landing-section-inner">
          <div ref={reveal} className="landing-section-label landing-reveal">Under the Hood</div>
          <h2 ref={reveal} className="landing-section-title landing-reveal d1">
            Built for trust, not just features.
          </h2>
          <p ref={reveal} className="landing-section-sub landing-reveal d2">
            The details that matter when health data is involved.
          </p>
          <div className="landing-features-grid">
            <FeatureCard
              revealRef={reveal}
              icon="&#128241;"
              iconBg="var(--color-accent-bg)"
              title="Installable PWA"
              description="Add to your home screen on any device. Works offline with local action queuing and automatic sync when reconnected. No app store required."
            />
            <FeatureCard
              revealRef={reveal}
              className="d1"
              icon="&#128018;"
              iconBg="var(--color-green-bg)"
              title="Drug Safety Lookups"
              description="Real-time interaction checks and allergy alerts via NIH RxNav and OpenFDA. No personal data is transmitted to these services."
            />
            <FeatureCard
              revealRef={reveal}
              className="d2"
              icon="&#128272;"
              iconBg="var(--color-amber-bg)"
              title="Privacy by Design"
              description="HTTPS-only transport, encryption at rest, Sentry error reporting with PII scrubbing, and AI keys that never touch the client."
            />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-section landing-cta">
        <div className="landing-section-inner" style={{ textAlign: 'center' }}>
          <h2 ref={reveal} className="landing-reveal">
            Ready to simplify your medication routine?
          </h2>
          <p ref={reveal} className="landing-reveal d1">
            Join the open beta. Free, no credit card, no commitment.
          </p>
          <div ref={reveal} className="landing-reveal d2" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/login')}
              className="!w-auto !min-w-[200px]"
            >
              Sign up free →
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/trust')}
              className="!w-auto !min-w-[200px]"
            >
              Review trust center
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-left">
            <div className="landing-nav-icon" style={{ width: 28, height: 28 }}>
              <LogoSvg size={16} />
            </div>
            <span>MarinLoop</span>
          </div>
          <div className="landing-footer-links">
            <button type="button" onClick={() => navigate('/terms')}>Terms</button>
            <button type="button" onClick={() => navigate('/privacy')}>Privacy</button>
            <button type="button" onClick={() => navigate('/trust')}>Trust Center</button>
            <a href="mailto:admin@marinloop.com" style={{ textDecoration: 'underline', textUnderlineOffset: 4, color: 'var(--color-text-tertiary)', fontSize: 'var(--text-caption)', transition: 'color 0.25s' }}>
              Contact
            </a>
          </div>
          <div className="landing-footer-copy">© 2026 MarinLoop. All rights reserved.</div>
        </div>
        <div className="landing-footer-disc">
          MarinLoop is a personal tracking and reminder product. It is not a medical
          device, does not provide clinical advice, and is not offered in this beta
          as a HIPAA-regulated deployment for covered-entity workflows. AI-assisted
          features are optional informational tools only and do not constitute
          medical recommendations. In a medical emergency, call 911 or your local
          emergency number. Always follow your healthcare provider&apos;s instructions.
        </div>
      </footer>
    </div>
  )
}
