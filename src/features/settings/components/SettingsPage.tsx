'use client'

import type { LucideIcon } from "lucide-react";
import {
  Shield,
  Cpu,
  DollarSign,
  Bell,
  User,
  Key,
  Sliders,
  ChevronRight,
  CheckCircle2,
  Send,
  Copy,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MotionFadeIn, MotionStagger, MotionStaggerItem } from "@/components/nebula/motion";
import { useState } from "react";

interface SettingSection {
  icon: LucideIcon;
  label: string;
  description: string;
  items: { label: string; value: string; type: "text" | "toggle" | "select" }[];
  color: string;
}

const SETTING_SECTIONS: SettingSection[] = [
  {
    icon: User,
    label: "Business Profile",
    description: "Your brand identity, niche, and audience targeting",
    color: "#3b82f6",
    items: [
      { label: "Business Name", value: "Not set", type: "text" },
      { label: "Niche / Industry", value: "Not set", type: "text" },
      { label: "Target Audience", value: "Not set", type: "text" },
    ],
  },
  {
    icon: Shield,
    label: "Brand Rules",
    description: "Tone of voice, blocked claims, and safety policies",
    color: "#7c3aed",
    items: [
      { label: "Tone of Voice", value: "Professional", type: "select" },
      { label: "Blocked Phrases", value: "None", type: "text" },
      { label: "Auto-Approval", value: "Off", type: "toggle" },
    ],
  },
  {
    icon: Cpu,
    label: "AI Configuration",
    description: "Model router settings, cost thresholds, and API keys",
    color: "#10b981",
    items: [
      { label: "Heavy Tasks", value: "Claude Agent SDK", type: "select" },
      { label: "Light Tasks", value: "GPT-5 Nano", type: "select" },
      { label: "CLAUDE_CODE_OAUTH_TOKEN", value: "Not set", type: "text" },
      { label: "OPENAI_API_KEY", value: "Not set", type: "text" },
    ],
  },
  {
    icon: DollarSign,
    label: "Revenue Settings",
    description: "Default offer IDs, CTA preferences, and pricing rules",
    color: "#f59e0b",
    items: [
      { label: "Primary Offer", value: "Not set", type: "text" },
      { label: "Default CTA", value: "Not set", type: "text" },
      { label: "Lead Magnet URL", value: "Not set", type: "text" },
    ],
  },
  {
    icon: Bell,
    label: "Notifications",
    description: "Alerts for approvals, mission completion, and errors",
    color: "#06b6d4",
    items: [
      { label: "Approval Alerts", value: "On", type: "toggle" },
      { label: "Mission Complete", value: "On", type: "toggle" },
      { label: "Error Alerts", value: "On", type: "toggle" },
    ],
  },
  {
    icon: Sliders,
    label: "Approval Thresholds",
    description: "Confidence levels required before auto-approval",
    color: "#f43f5e",
    items: [
      { label: "Confidence Threshold", value: "80%", type: "select" },
      { label: "Brand Safety Threshold", value: "90%", type: "select" },
      { label: "Require Human Review", value: "Always", type: "select" },
    ],
  },
];

const ENV_STATUS = [
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    label: "Supabase URL",
    set: false,
    phase: "Phase 0",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    label: "Supabase Anon Key",
    set: false,
    phase: "Phase 0",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    label: "Supabase Service Role",
    set: false,
    phase: "Phase 0",
  },
  {
    key: "CLAUDE_CODE_OAUTH_TOKEN",
    label: "Claude Max Token",
    set: false,
    phase: "Phase 0",
  },
  {
    key: "OPENAI_API_KEY",
    label: "OpenAI API Key",
    set: false,
    phase: "Phase 0",
  },
];

function TelegramConnectCard() {
  const [loading, setLoading] = useState(false)
  const [command, setCommand] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/telegram/link-code', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate code')
      const { linkCode, botUsername } = await res.json()
      setCommand(`/start ${linkCode}`)
      // open bot in new tab
      window.open(`https://t.me/${botUsername}`, '_blank')
    } catch {
      setError('Could not generate link code. Are you signed in?')
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    if (!command) return
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card glow="primary">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-[var(--radius)]"
            style={{ background: '#0088cc18', border: '1px solid #0088cc30' }}>
            <Send size={14} style={{ color: '#0088cc' }} />
          </div>
          <div>
            <CardTitle className="text-sm">Telegram</CardTitle>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Connect your Telegram account to control Agent MOE from your phone
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {!command ? (
          <Button
            size="sm"
            onClick={generate}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <><Loader2 size={13} className="animate-spin mr-2" />Generating...</>
            ) : (
              'Generate Link Code'
            )}
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-muted)]">
              Telegram opened in a new tab. Paste this command there:
            </p>
            <div className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius)]",
              "border border-[var(--border-subtle)] bg-[var(--surface-elevated)]"
            )}>
              <code className="text-xs font-mono text-[var(--primary)] flex-1 truncate">
                {command}
              </code>
              <button onClick={copy} className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <Copy size={13} />
              </button>
            </div>
            {copied && <p className="text-xs text-[var(--success)]">Copied!</p>}
            <p className="text-xs text-[var(--text-disabled)]">Code expires in 15 minutes.</p>
          </div>
        )}
        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      </CardContent>
    </Card>
  )
}

function SettingSectionCard({ section }: { section: SettingSection }) {
  const Icon = section.icon;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius)]"
            style={{
              background: `${section.color}18`,
              border: `1px solid ${section.color}30`,
            }}
          >
            <Icon size={14} style={{ color: section.color }} />
          </div>
          <div>
            <CardTitle className="text-sm">{section.label}</CardTitle>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {section.description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {section.items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center justify-between gap-3 px-3 py-2.5",
              "rounded-[var(--radius)] border border-[var(--border-subtle)]",
              "bg-[var(--surface-elevated)]",
              "hover:border-[var(--border)] transition-colors duration-100 cursor-pointer group"
            )}
          >
            <span className="text-sm text-[var(--text-secondary)]">
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  item.value === "Not set"
                    ? "text-[var(--text-disabled)]"
                    : "text-[var(--text-muted)]"
                )}
              >
                {item.value}
              </span>
              <ChevronRight
                size={13}
                className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] transition-colors"
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <MotionFadeIn>
        <div className="flex items-center justify-end gap-2">
          <Badge variant="muted">Phase 0 Active</Badge>
        </div>
      </MotionFadeIn>

      {/* Environment variables status */}
      <MotionFadeIn delay={0.05}>
      <Card glow="primary">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key size={15} className="text-[var(--primary)]" />
            <CardTitle className="text-sm">Environment Variables</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <p className="text-xs text-[var(--text-muted)] mb-3">
            Required keys for Phase 0 — configure in{" "}
            <code className="text-[var(--primary)] font-mono">.env.local</code>
          </p>
          {ENV_STATUS.map((env) => (
            <div
              key={env.key}
              className={cn(
                "flex items-center gap-3 px-3 py-2",
                "rounded-[var(--radius)] border border-[var(--border-subtle)]",
                "bg-[var(--surface-elevated)]"
              )}
            >
              {env.set ? (
                <CheckCircle2 size={13} className="text-[var(--success)] shrink-0" />
              ) : (
                <div className="w-3 h-3 rounded-full border border-[var(--text-disabled)] shrink-0" />
              )}
              <code className="text-xs font-mono text-[var(--text-muted)] flex-1">
                {env.key}
              </code>
              <span className="text-xs text-[var(--text-secondary)]">
                {env.label}
              </span>
              <Badge variant="muted" className="text-[9px] shrink-0">
                {env.phase}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      </MotionFadeIn>

      {/* Telegram connect */}
      <MotionFadeIn delay={0.1}>
        <TelegramConnectCard />
      </MotionFadeIn>

      {/* Setting sections grid */}
      <MotionStagger className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SETTING_SECTIONS.map((section) => (
          <MotionStaggerItem key={section.label}>
            <SettingSectionCard section={section} />
          </MotionStaggerItem>
        ))}
      </MotionStagger>
    </div>
  );
}
