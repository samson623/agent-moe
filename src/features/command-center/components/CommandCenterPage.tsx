import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  Users,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon: LucideIcon;
  glowColor?: string;
}

function StatCard({
  label,
  value,
  delta,
  deltaPositive = true,
  icon: Icon,
  glowColor = "rgba(59,130,246,0.15)",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[var(--radius-lg)] border border-[var(--border)] p-5",
        "bg-[var(--surface)] overflow-hidden",
        "transition-all duration-200 hover:border-[rgba(59,130,246,0.3)]"
      )}
      style={{ boxShadow: `inset 0 0 40px ${glowColor}` }}
    >
      {/* Background gradient orb */}
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 blur-xl"
        style={{ background: glowColor.replace("0.15", "0.8") }}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-[var(--text)] leading-none">
            {value}
          </p>
          {delta && (
            <p
              className={cn(
                "text-xs mt-1.5 font-medium",
                deltaPositive
                  ? "text-[var(--success)]"
                  : "text-[var(--danger)]"
              )}
            >
              {deltaPositive ? "+" : ""}
              {delta} today
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-[var(--radius)]",
            "border border-[var(--border)]",
            "bg-[var(--surface-elevated)]"
          )}
        >
          <Icon size={18} className="text-[var(--primary)]" />
        </div>
      </div>
    </div>
  );
}

interface ActivityItem {
  id: string;
  type: "mission" | "asset" | "approval" | "operator";
  title: string;
  description: string;
  time: string;
  status: "running" | "completed" | "pending" | "failed";
}

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "1",
    type: "mission",
    title: "Mission queued",
    description: "Awaiting Mission Engine — build started",
    time: "Just now",
    status: "pending",
  },
  {
    id: "2",
    type: "operator",
    title: "Content Strike Team",
    description: "Operators ready — Phase 3 pending",
    time: "System init",
    status: "pending",
  },
  {
    id: "3",
    type: "asset",
    title: "Content Studio",
    description: "Asset management coming in Phase 4",
    time: "Scheduled",
    status: "pending",
  },
];

function ActivityRow({ item }: { item: ActivityItem }) {
  const statusConfig = {
    running: {
      color: "text-[var(--primary)]",
      bg: "bg-[var(--primary-muted)]",
      icon: Clock,
    },
    completed: {
      color: "text-[var(--success)]",
      bg: "bg-[var(--success-muted)]",
      icon: CheckCircle2,
    },
    pending: {
      color: "text-[var(--warning)]",
      bg: "bg-[var(--warning-muted)]",
      icon: Clock,
    },
    failed: {
      color: "text-[var(--danger)]",
      bg: "bg-[var(--danger-muted)]",
      icon: AlertCircle,
    },
  }[item.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3",
        "border-b border-[var(--border-subtle)] last:border-none",
        "hover:bg-[var(--surface-hover)] transition-colors duration-100"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-0.5",
          statusConfig.bg
        )}
      >
        <StatusIcon size={13} className={statusConfig.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text)] truncate">
          {item.title}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {item.description}
        </p>
      </div>
      <span className="text-[10px] text-[var(--text-disabled)] shrink-0 mt-1">
        {item.time}
      </span>
    </div>
  );
}

const OPERATOR_TEAMS = [
  {
    name: "Content Strike Team",
    desc: "Posts, hooks, scripts, captions",
    icon: FileText,
    color: "var(--primary)",
    phase: "Phase 3",
  },
  {
    name: "Growth Operator",
    desc: "Trends, signals, opportunity scoring",
    icon: TrendingUp,
    color: "var(--success)",
    phase: "Phase 3",
  },
  {
    name: "Revenue Closer",
    desc: "Offers, CTAs, funnel logic",
    icon: Zap,
    color: "var(--warning)",
    phase: "Phase 3",
  },
  {
    name: "Brand Guardian",
    desc: "Safety review, tone, approval",
    icon: Users,
    color: "var(--accent)",
    phase: "Phase 5",
  },
];

export function CommandCenterPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-[var(--radius-lg)]",
              "bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]",
              "shadow-[0_0_24px_rgba(59,130,246,0.4)]"
            )}
          >
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">
              Command Center
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Mission control and platform overview
            </p>
          </div>
        </div>
        <Badge variant="warning">Phase 1 — Building</Badge>
      </div>

      {/* Mission input area */}
      <div
        className={cn(
          "relative rounded-[var(--radius-xl)] border border-[rgba(59,130,246,0.25)] p-6",
          "bg-gradient-to-br from-[var(--surface)] to-[var(--surface-elevated)]",
          "shadow-[0_0_32px_rgba(59,130,246,0.08)]"
        )}
      >
        <div className="flex items-start gap-3 mb-4">
          <Zap size={18} className="text-[var(--primary)] mt-0.5 shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-[var(--text)]">
              Mission Input
            </h3>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Type a mission — operators plan, execute, and deliver.
            </p>
          </div>
        </div>
        <div
          className={cn(
            "relative rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)]",
            "bg-[var(--surface)] p-6 text-center",
            "hover:border-[var(--primary)] transition-colors duration-200"
          )}
        >
          <p className="text-[var(--text-muted)] text-sm">
            Mission Engine coming in{" "}
            <span className="text-[var(--primary)] font-medium">Phase 2</span>
          </p>
          <p className="text-xs text-[var(--text-disabled)] mt-1">
            Natural language → Plan → Jobs → Operators → Assets
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Missions Today"
          value="0"
          icon={Zap}
          glowColor="rgba(59,130,246,0.15)"
        />
        <StatCard
          label="Assets Created"
          value="0"
          icon={FileText}
          glowColor="rgba(124,58,237,0.15)"
        />
        <StatCard
          label="Pending Approvals"
          value="0"
          icon={CheckCircle2}
          glowColor="rgba(245,158,11,0.15)"
        />
        <StatCard
          label="Approval Rate"
          value="—"
          icon={TrendingUp}
          glowColor="rgba(16,185,129,0.15)"
        />
      </div>

      {/* Two column: activity + operators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>System Activity</CardTitle>
              <Badge variant="muted">Live</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-3">
            {MOCK_ACTIVITY.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
            <div className="px-4 py-3">
              <Button variant="ghost" size="sm" className="w-full gap-2">
                View all activity
                <ArrowRight size={13} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Operator teams */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Operator Teams</CardTitle>
              <Badge variant="muted">4 Teams</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-3 space-y-2">
            {OPERATOR_TEAMS.map((team) => {
              const Icon = team.icon;
              return (
                <div
                  key={team.name}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-[var(--radius)]",
                    "border border-[var(--border-subtle)]",
                    "bg-[var(--surface-elevated)]",
                    "hover:border-[var(--border)] transition-colors duration-100"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-[var(--radius)] shrink-0"
                    )}
                    style={{
                      background: `${team.color}20`,
                      border: `1px solid ${team.color}30`,
                    }}
                  >
                    <Icon size={14} style={{ color: team.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">
                      {team.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {team.desc}
                    </p>
                  </div>
                  <Badge variant="muted" className="shrink-0 text-[10px]">
                    {team.phase}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
