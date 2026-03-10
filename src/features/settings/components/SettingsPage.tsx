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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
      <div className="flex items-center justify-end gap-2">
        <Badge variant="muted">Phase 0 Active</Badge>
      </div>

      {/* Environment variables status */}
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

      {/* Setting sections grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SETTING_SECTIONS.map((section) => (
          <SettingSectionCard key={section.label} section={section} />
        ))}
      </div>
    </div>
  );
}
