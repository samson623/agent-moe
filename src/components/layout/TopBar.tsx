"use client";

import { usePathname } from "next/navigation";
import { Bell, User, ChevronRight, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceId } from "@/lib/hooks/use-workspace-id";
import { PendingApprovalsBadge } from "@/features/command-center/components/PendingApprovalsBadge";
import { useApprovalCount } from "@/features/command-center/hooks/use-approval-count";
import { useTheme } from "./ThemeProvider";

const ROUTE_META: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Command Center",
    subtitle: "Mission control and system overview",
  },
  "/missions": {
    title: "Missions",
    subtitle: "AI-powered task orchestration",
  },
  "/content": {
    title: "Content Studio",
    subtitle: "All generated assets and deliverables",
  },
  "/video": {
    title: "Video Studio",
    subtitle: "Short-form video packages",
  },
  "/operators": {
    title: "Operators",
    subtitle: "AI operator teams and activity",
  },
  "/growth": {
    title: "Growth Engine",
    subtitle: "Signals, trends, and opportunities",
  },
  "/revenue": {
    title: "Revenue Lab",
    subtitle: "Offers, CTAs, and conversion paths",
  },
  "/launchpad": {
    title: "Launchpad",
    subtitle: "Campaigns and launch timelines",
  },
  "/approvals": {
    title: "Approval Queue",
    subtitle: "Review and control what ships",
  },
  "/browser": {
    title: "Browser Agent",
    subtitle: "Automated web task execution",
  },
  "/connectors": {
    title: "Connectors",
    subtitle: "Linked platforms and external services",
  },
  "/analytics": {
    title: "Analytics",
    subtitle: "Performance metrics and operator insights",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Business rules, tone, and configuration",
  },
};

const FALLBACK_META = { title: "Agent Moe", subtitle: "" } as const;

function getRouteMeta(pathname: string): { title: string; subtitle: string } {
  if (pathname === "/") return ROUTE_META["/"] ?? FALLBACK_META;

  const match = Object.keys(ROUTE_META).find(
    (key) => key !== "/" && pathname.startsWith(key)
  );

  return (match ? ROUTE_META[match] : undefined) ?? FALLBACK_META;
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "relative flex items-center justify-center",
        "w-10 h-10 rounded-[var(--radius)]",
        "border border-[var(--border)] bg-[var(--surface-elevated)]",
        "text-[var(--text-muted)] hover:text-[var(--text)]",
        "hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]",
        "transition-all duration-200"
      )}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun size={16} className="transition-transform duration-200" />
      ) : (
        <Moon size={16} className="transition-transform duration-200" />
      )}
    </button>
  );
}

function NotificationButton({
  approvalCount,
  approvalsLoading,
}: {
  approvalCount: number;
  approvalsLoading: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative flex items-center justify-center",
        "w-10 h-10 rounded-[var(--radius)]",
        "border border-[var(--border)] bg-[var(--surface-elevated)]",
        "text-[var(--text-muted)] hover:text-[var(--text)]",
        "hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]",
        "transition-all duration-200"
      )}
      aria-label={`Notifications${approvalCount > 0 ? ` — ${approvalCount} pending` : ""}`}
    >
      <Bell size={16} />
      <PendingApprovalsBadge count={approvalCount} isLoading={approvalsLoading} />
    </button>
  );
}

function UserAvatar() {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-2.5 pl-2 pr-3.5 py-2 rounded-[var(--radius)]",
        "border border-[var(--border)] bg-[var(--surface-elevated)]",
        "text-[var(--text-secondary)] hover:text-[var(--text)]",
        "hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]",
        "transition-all duration-200 text-sm font-medium"
      )}
      aria-label="User menu"
    >
      <span
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-full",
          "bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]",
          "text-white text-[10px] font-bold"
        )}
      >
        <User size={14} />
      </span>
      <span>Operator</span>
    </button>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const meta = getRouteMeta(pathname);
  const { workspaceId } = useWorkspaceId();
  const { count: approvalCount, isLoading: approvalsLoading } =
    useApprovalCount(workspaceId ?? "");

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30",
        "left-[var(--sidebar-width)]",
        "h-[var(--topbar-height)]",
        "flex items-center justify-between px-8",
        "bg-[var(--surface)] border-b border-[var(--border)]",
        "transition-colors duration-200"
      )}
    >
      {/* Left: breadcrumb + page title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-[var(--text-muted)] text-sm hidden sm:block">
          Agent Moe
        </span>
        <ChevronRight
          size={14}
          className="text-[var(--text-disabled)] hidden sm:block shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <h1 className="text-[1.125rem] font-semibold text-[var(--text)] leading-tight truncate tracking-[-0.01em]">
            {meta.title}
          </h1>
          {meta.subtitle && (
            <span className="text-[13px] text-[var(--text-muted)] mt-0.5 hidden md:block">
              {meta.subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <ThemeToggle />
        <NotificationButton
          approvalCount={approvalCount}
          approvalsLoading={approvalsLoading}
        />
        <UserAvatar />
      </div>
    </header>
  );
}
