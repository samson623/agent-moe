"use client";

import { usePathname } from "next/navigation";
import { Bell, Moon, Sun, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceId } from "@/lib/hooks/use-workspace-id";
import { PendingApprovalsBadge } from "@/features/command-center/components/PendingApprovalsBadge";
import { useApprovalCount } from "@/features/command-center/hooks/use-approval-count";
import { useTheme } from "./ThemeProvider";

const PAGE_TITLES: Record<string, string> = {
  "/": "Command Center",
  "/missions": "Missions",
  "/content": "Content Studio",
  "/video": "Video Studio",
  "/operators": "Operators",
  "/approvals": "Approvals",
  "/growth": "Growth Engine",
  "/browser": "Browser Agent",
  "/revenue": "Revenue Lab",
  "/launchpad": "Launchpad",
  "/connectors": "Connectors",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

function getTitle(pathname: string) {
  const match = Object.keys(PAGE_TITLES).find((key) =>
    key !== "/" ? pathname.startsWith(key) : pathname === key
  );
  return match ? PAGE_TITLES[match] : "Command Center";
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)]",
        "border border-[var(--border)] bg-[var(--surface-elevated)]",
        "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]",
        "transition-colors duration-150"
      )}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
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
        "relative inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)]",
        "border border-[var(--border)] bg-[var(--surface-elevated)]",
        "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]",
        "transition-colors duration-150"
      )}
      aria-label={`Notifications${approvalCount > 0 ? ` - ${approvalCount} pending` : ""}`}
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
        "inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)]",
        "bg-[var(--surface-elevated)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)]",
        "hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors duration-150"
      )}
      aria-label="User menu"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-[var(--text-inverse)]">
        <User size={12} />
      </span>
      <span className="hidden sm:inline">Operator</span>
    </button>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const { workspaceId } = useWorkspaceId();
  const { count: approvalCount, isLoading: approvalsLoading } =
    useApprovalCount(workspaceId ?? "");

  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-3 md:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-[var(--text)] truncate">
          {getTitle(pathname)}
        </h1>
        <span className="hidden sm:inline-flex items-center h-5 px-2 rounded-full bg-[var(--success-subtle)] text-[var(--success)] text-[11px] font-medium shrink-0">
          Online
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
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
