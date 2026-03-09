import type { LucideIcon } from "lucide-react";
import {
  TrendingUp,
  Target,
  BarChart3,
  Globe,
  Flame,
  Zap,
  Search,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SignalCardProps {
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
  status: string;
}

const SIGNAL_TYPES: SignalCardProps[] = [
  {
    icon: Flame,
    label: "Trend Scanner",
    description:
      "Real-time topic momentum and velocity tracking across platforms",
    color: "#f59e0b",
    status: "Phase 7",
  },
  {
    icon: Target,
    label: "Competitor Gaps",
    description:
      "Identify what competitors are not covering — claim the whitespace",
    color: "#3b82f6",
    status: "Phase 7",
  },
  {
    icon: BarChart3,
    label: "Topic Scoring",
    description:
      "GPT-5 Nano scores topics by audience fit, momentum, and potential",
    color: "#10b981",
    status: "Phase 7",
  },
  {
    icon: Globe,
    label: "Web Research",
    description:
      "Browser agent pulls live data, articles, and signals from the web",
    color: "#7c3aed",
    status: "Phase 8",
  },
  {
    icon: Search,
    label: "Opportunity Board",
    description: "Ranked opportunities ready to spin into content missions",
    color: "#06b6d4",
    status: "Phase 7",
  },
  {
    icon: Eye,
    label: "Audience Fit",
    description:
      "Match trending signals to your specific audience profile and goals",
    color: "#f43f5e",
    status: "Phase 7",
  },
];

function SignalCard({ card }: { card: SignalCardProps }) {
  const Icon = card.icon;

  return (
    <div
      className={cn(
        "p-4 rounded-[var(--radius-lg)] border border-[var(--border)]",
        "bg-[var(--surface)] hover:border-[var(--border)]",
        "hover:bg-[var(--surface-hover)] transition-all duration-150 group"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] shrink-0"
          style={{
            background: `${card.color}18`,
            border: `1px solid ${card.color}30`,
          }}
        >
          <Icon size={16} style={{ color: card.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-[var(--text)]">
              {card.label}
            </p>
            <Badge variant="muted" className="text-[9px] shrink-0">
              {card.status}
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {card.description}
          </p>
        </div>
      </div>
    </div>
  );
}

const MOCK_OPPORTUNITIES = [
  {
    topic: "AI agent economics in 2026",
    score: 94,
    platform: "LinkedIn",
    momentum: "+48%",
  },
  {
    topic: "GPT cost vs. Claude Max breakdown",
    score: 88,
    platform: "X",
    momentum: "+31%",
  },
  {
    topic: "Operator-based AI workflows",
    score: 82,
    platform: "YouTube",
    momentum: "+22%",
  },
  {
    topic: "Content automation for solopreneurs",
    score: 76,
    platform: "LinkedIn",
    momentum: "+17%",
  },
];

export function GrowthEnginePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-[var(--radius-lg)]",
              "bg-gradient-to-br from-[#10b981] to-[#3b82f6]",
              "shadow-[0_0_24px_rgba(16,185,129,0.4)]"
            )}
          >
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">
              Growth Engine
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Signals, trends, competitor analysis, and opportunity scoring
            </p>
          </div>
        </div>
        <Badge variant="warning">Phase 7 — Building Soon</Badge>
      </div>

      {/* Signal types grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SIGNAL_TYPES.map((card) => (
          <SignalCard key={card.label} card={card} />
        ))}
      </div>

      {/* Opportunity board preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Opportunity Board</CardTitle>
            <Badge variant="muted">Preview</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <div className="px-5 pb-3">
            <p className="text-xs text-[var(--text-muted)]">
              Ranked by momentum score — live data in Phase 7
            </p>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {MOCK_OPPORTUNITIES.map((opp, i) => (
              <div
                key={opp.topic}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5",
                  "hover:bg-[var(--surface-hover)] transition-colors duration-100"
                )}
              >
                {/* Rank */}
                <span className="text-xs font-bold text-[var(--text-muted)] w-4 shrink-0">
                  #{i + 1}
                </span>

                {/* Topic */}
                <p className="flex-1 text-sm font-medium text-[var(--text)] truncate">
                  {opp.topic}
                </p>

                {/* Platform */}
                <span className="text-xs text-[var(--text-muted)] shrink-0">
                  {opp.platform}
                </span>

                {/* Momentum */}
                <span className="text-xs font-semibold text-[var(--success)] shrink-0">
                  {opp.momentum}
                </span>

                {/* Score bar */}
                <div className="flex items-center gap-2 shrink-0 w-24">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--border)]">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--success)]"
                      style={{ width: `${opp.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[var(--text)] tabular-nums">
                    {opp.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      <div
        className={cn(
          "relative rounded-[var(--radius-xl)] border border-[var(--border)]",
          "bg-[var(--surface)] p-12 text-center overflow-hidden"
        )}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center gap-4">
          <div
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-[var(--radius-xl)]",
              "border border-[rgba(16,185,129,0.3)]"
            )}
            style={{ background: "rgba(16,185,129,0.12)" }}
          >
            <Zap size={24} className="text-[var(--success)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-1.5">
              Growth Engine
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              The Growth Operator will scan the web in real-time, score topics
              by momentum, surface competitor gaps, and deliver ranked
              opportunities directly to your mission queue.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Badge variant="success">Phase 7 — Trend Engine</Badge>
            <Badge variant="muted">Browser Agent</Badge>
            <Badge variant="muted">GPT-5 Nano Scoring</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
