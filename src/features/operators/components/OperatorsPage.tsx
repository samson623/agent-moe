import type { LucideIcon } from "lucide-react";
import {
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  Shield,
  Activity,
  Clock,
  Cpu,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OperatorCardProps {
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  icon: LucideIcon;
  color: string;
  model: string;
  phase: string;
  status: "online" | "idle" | "building";
}

const OPERATORS: OperatorCardProps[] = [
  {
    name: "Content Strike Team",
    role: "Content Generation",
    description:
      "Produces posts, hooks, video scripts, captions, carousels, and CTA packs optimized per platform.",
    capabilities: [
      "Social posts",
      "Video scripts",
      "Captions",
      "Hooks",
      "CTA packs",
      "Repurposing",
    ],
    icon: FileText,
    color: "#3b82f6",
    model: "Claude Agent SDK",
    phase: "Phase 3",
    status: "building",
  },
  {
    name: "Growth Operator",
    role: "Market Intelligence",
    description:
      "Scans trends, scores topics, maps competitor gaps, and surfaces high-leverage content opportunities.",
    capabilities: [
      "Trend scanning",
      "Topic scoring",
      "Competitor analysis",
      "Opportunity board",
      "Audience fit",
    ],
    icon: TrendingUp,
    color: "#10b981",
    model: "Claude Agent SDK",
    phase: "Phase 7",
    status: "building",
  },
  {
    name: "Revenue Closer",
    role: "Monetization Strategy",
    description:
      "Maps offers to content, selects CTAs, builds lead magnets, and positions conversion paths.",
    capabilities: [
      "Offer mapping",
      "CTA strategy",
      "Lead magnets",
      "Funnel logic",
      "Pricing ladders",
    ],
    icon: DollarSign,
    color: "#f59e0b",
    model: "Claude Agent SDK",
    phase: "Phase 10",
    status: "building",
  },
  {
    name: "Brand Guardian",
    role: "Safety & Approval",
    description:
      "Enforces tone rules, flags risky claims, applies blocked phrases, and routes to the approval queue.",
    capabilities: [
      "Tone enforcement",
      "Claim flagging",
      "Safety review",
      "Approval routing",
      "Brand rules",
    ],
    icon: Shield,
    color: "#7c3aed",
    model: "Claude Agent SDK",
    phase: "Phase 5",
    status: "building",
  },
];

const STATUS_MAP = {
  online: { label: "Online", variant: "success" as const },
  idle: { label: "Idle", variant: "muted" as const },
  building: { label: "Building", variant: "warning" as const },
};

function OperatorCard({ op }: { op: OperatorCardProps }) {
  const Icon = op.icon;
  const statusMeta = STATUS_MAP[op.status];

  return (
    <Card className="overflow-hidden group hover:border-[var(--border)] transition-all duration-200">
      {/* Top color bar */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${op.color}, ${op.color}40)`,
        }}
      />

      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-[var(--radius)]"
              style={{
                background: `${op.color}18`,
                border: `1px solid ${op.color}30`,
              }}
            >
              <Icon size={18} style={{ color: op.color }} />
            </div>
            <div>
              <CardTitle className="text-sm">{op.name}</CardTitle>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {op.role}
              </p>
            </div>
          </div>
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {op.description}
        </p>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1.5">
          {op.capabilities.map((cap) => (
            <span
              key={cap}
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full",
                "bg-[var(--surface-elevated)] text-[var(--text-muted)]",
                "border border-[var(--border-subtle)]"
              )}
            >
              {cap}
            </span>
          ))}
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Cpu size={12} className="text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)]">{op.model}</span>
          </div>
          <Badge variant="muted" className="text-[10px]">
            {op.phase}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

const STATS = [
  { label: "Total Operators", value: "4", icon: Users },
  { label: "Active Jobs", value: "0", icon: Activity },
  { label: "Queue Depth", value: "0", icon: Clock },
  { label: "Model: Claude SDK", value: "Ready", icon: Cpu },
];

export function OperatorsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-[var(--radius-lg)]",
              "bg-gradient-to-br from-[var(--accent)] to-[var(--primary)]",
              "shadow-[0_0_24px_rgba(124,58,237,0.4)]"
            )}
          >
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">Operators</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Four specialized AI operator teams — Claude Agent SDK subagents
            </p>
          </div>
        </div>
        <Badge variant="warning">Phase 3 — Building Soon</Badge>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-3 p-4 rounded-[var(--radius-lg)]",
              "border border-[var(--border)] bg-[var(--surface)]"
            )}
          >
            <Icon size={16} className="text-[var(--primary)] shrink-0" />
            <div>
              <p className="text-lg font-bold text-[var(--text)] leading-none">
                {value}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Operator cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OPERATORS.map((op) => (
          <OperatorCard key={op.name} op={op} />
        ))}
      </div>

      {/* Architecture note */}
      <Card glow="accent">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Cpu size={18} className="text-[var(--accent)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--text)]">
                AI Architecture — Dual Model Strategy
              </p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Complex reasoning tasks and tool-use run through{" "}
                <span className="text-[var(--primary)] font-medium">
                  Claude Agent SDK
                </span>{" "}
                (Max subscription, $0 cost). High-volume simple tasks like
                classification and scoring use{" "}
                <span className="text-[var(--success)] font-medium">
                  GPT-5 Nano
                </span>{" "}
                ($0.05/M tokens). A{" "}
                <span className="text-[var(--accent)] font-medium">
                  Model Router
                </span>{" "}
                selects the right model per job automatically.
              </p>
            </div>
            <Button variant="ghost" size="icon-sm" className="shrink-0">
              <ArrowRight size={14} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
