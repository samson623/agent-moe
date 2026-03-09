import {
  Rocket,
  Calendar,
  Clock,
  Play,
  CheckSquare,
  BarChart2,
  Layers,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CAMPAIGN_FEATURES = [
  {
    icon: Layers,
    label: "Campaign Sequencer",
    description: "Group related content into coordinated multi-platform launches",
    color: "#3b82f6",
  },
  {
    icon: Calendar,
    label: "Timeline Calendar",
    description: "Visual launch calendar with asset scheduling and dependencies",
    color: "#7c3aed",
  },
  {
    icon: Clock,
    label: "Launch Timing",
    description: "Optimal publish windows based on audience activity data",
    color: "#f59e0b",
  },
  {
    icon: Play,
    label: "One-Click Launch",
    description: "Trigger approved content sequences across all connected platforms",
    color: "#10b981",
  },
  {
    icon: CheckSquare,
    label: "Pre-Launch Checklist",
    description: "Automated verification: approved, ready, connectors live",
    color: "#06b6d4",
  },
  {
    icon: BarChart2,
    label: "Campaign Analytics",
    description: "Performance tracking per campaign — aggregate and per-platform",
    color: "#f43f5e",
  },
];

const MOCK_CAMPAIGNS = [
  {
    name: "AI Operator Series",
    status: "Draft",
    assets: 0,
    platforms: ["LinkedIn", "X"],
    phase: "Phase 11",
  },
  {
    name: "Revenue Lab Launch",
    status: "Draft",
    assets: 0,
    platforms: ["YouTube", "Instagram"],
    phase: "Phase 11",
  },
];

export function LaunchpadPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-[var(--radius-lg)]",
              "bg-gradient-to-br from-[#7c3aed] to-[#f43f5e]",
              "shadow-[0_0_24px_rgba(124,58,237,0.4)]"
            )}
          >
            <Rocket size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">Launchpad</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Grouped campaigns, sequenced launches, and timeline orchestration
            </p>
          </div>
        </div>
        <Badge variant="warning">Phase 11 — Building Soon</Badge>
      </div>

      {/* Campaign list preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campaigns</CardTitle>
            <Badge variant="muted">{MOCK_CAMPAIGNS.length} Draft</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-3">
          <div className="divide-y divide-[var(--border-subtle)]">
            {MOCK_CAMPAIGNS.map((campaign) => (
              <div
                key={campaign.name}
                className={cn(
                  "flex items-center gap-4 px-5 py-4",
                  "hover:bg-[var(--surface-hover)] transition-colors duration-100"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-[var(--radius)]",
                    "bg-[var(--primary-muted)] border border-[rgba(59,130,246,0.2)]"
                  )}
                >
                  <Rocket size={14} className="text-[var(--primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)] truncate">
                    {campaign.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {campaign.platforms.map((p) => (
                      <span
                        key={p}
                        className="text-[10px] text-[var(--text-muted)] font-medium"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {campaign.assets} assets
                </span>
                <Badge variant="muted">{campaign.status}</Badge>
                <Badge variant="muted" className="text-[9px]">
                  {campaign.phase}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CAMPAIGN_FEATURES.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.label}
              className={cn(
                "p-4 rounded-[var(--radius-lg)] border border-[var(--border)]",
                "bg-[var(--surface)] hover:bg-[var(--surface-hover)]",
                "transition-all duration-150"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] shrink-0"
                  style={{
                    background: `${feat.color}18`,
                    border: `1px solid ${feat.color}30`,
                  }}
                >
                  <Icon size={15} style={{ color: feat.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)] mb-0.5">
                    {feat.label}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
              "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center gap-4">
          <div
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-[var(--radius-xl)]",
              "border border-[rgba(124,58,237,0.3)]"
            )}
            style={{ background: "rgba(124,58,237,0.12)" }}
          >
            <Zap size={24} className="text-[var(--accent)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-1.5">
              Launchpad
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              Group approved content into sequenced campaigns, set launch
              timelines, and fire coordinated multi-platform launches with one
              click.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Badge variant="accent">Phase 11 — Campaign Orchestrator</Badge>
            <Badge variant="muted">Timeline Calendar</Badge>
            <Badge variant="muted">One-Click Launch</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
