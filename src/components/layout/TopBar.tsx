"use client";

import { usePathname } from "next/navigation";
import { Bell, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUTE_META: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Command Center",
    subtitle: "Mission control and system overview",
  },
  "/content": {
    title: "Content Studio",
    subtitle: "All generated assets and deliverables",
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
  "/connectors": {
    title: "Connectors",
    subtitle: "Linked platforms and external services",
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

function NotificationButton() {
  return (
    <button
      type="button"
      className={cn(
        "relative flex items-center justify-center",
        "w-9 h-9 rounded-[var(--radius)]",
        "border border-[var(--border)] bg-[var(--surface-elevated)]",
        "text-[var(--text-muted)] hover:text-[var(--text)]",
        "hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]",
        "transition-all duration-150"
      )}
      aria-label="Notifications"
    >
      <Bell size={15} />
      {/* Notification dot */}
      <span
        className={cn(
          "absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full",
          "bg-[var(--primary)]",
          "shadow-[0_0_6px_var(--primary)]"
        )}
        aria-hidden="true"
      />
    </button>
  );
}

function UserAvatar() {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-[var(--radius)]",
        "border border-[var(--border)] bg-[var(--surface-elevated)]",
        "text-[var(--text-secondary)] hover:text-[var(--text)]",
        "hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]",
        "transition-all duration-150 text-sm font-medium"
      )}
      aria-label="User menu"
    >
      {/* Avatar placeholder */}
      <span
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full",
          "bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]",
          "text-white text-[10px] font-bold"
        )}
      >
        <User size={12} />
      </span>
      <span>Operator</span>
    </button>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const meta = getRouteMeta(pathname);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30",
        "left-[var(--sidebar-width)]",
        "h-[var(--topbar-height)]",
        "flex items-center justify-between px-6",
        "bg-[var(--surface)] border-b border-[var(--border)]"
      )}
    >
      {/* Left: breadcrumb + page title */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[var(--text-muted)] text-sm hidden sm:block">
          Agent Moe
        </span>
        <ChevronRight
          size={14}
          className="text-[var(--text-disabled)] hidden sm:block shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <h1 className="text-[15px] font-semibold text-[var(--text)] leading-none truncate">
            {meta.title}
          </h1>
          {meta.subtitle && (
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5 hidden md:block">
              {meta.subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <NotificationButton />
        <UserAvatar />
      </div>
    </header>
  );
}
