"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  Film,
  Map,
  Users,
  TrendingUp,
  DollarSign,
  Rocket,
  Link as LinkIcon,
  Settings,
  Zap,
  ShieldCheck,
  Globe,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AppRoute = "/" | "/missions" | "/content" | "/video" | "/operators" | "/approvals" | "/growth" | "/browser" | "/revenue" | "/launchpad" | "/connectors" | "/analytics" | "/settings";

interface NavItem {
  href: AppRoute;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/missions", label: "Missions", icon: Map },
  { href: "/content", label: "Content Studio", icon: FileText },
  { href: "/video", label: "Video Studio", icon: Film },
  { href: "/operators", label: "Operators", icon: Users },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/growth", label: "Growth Engine", icon: TrendingUp },
  { href: "/browser", label: "Browser Agent", icon: Globe },
  { href: "/revenue", label: "Revenue Lab", icon: DollarSign },
  { href: "/launchpad", label: "Launchpad", icon: Rocket },
  { href: "/connectors", label: "Connectors", icon: LinkIcon },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function MoeLogo() {
  return (
    <div className="flex items-center gap-3 px-5 h-[var(--topbar-height)] border-b border-[var(--border)] shrink-0">
      <div
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-lg",
          "bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]",
          "shadow-[var(--glow-primary)]"
        )}
      >
        <Zap size={18} className="text-white" />
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "text-xl font-bold tracking-[0.06em]",
            "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]",
            "bg-clip-text text-transparent"
          )}
        >
          MOE
        </span>
        <span className="text-[10px] text-[var(--text-muted)] font-semibold tracking-[0.14em] uppercase">
          AI Operator
        </span>
      </div>
    </div>
  );
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-[var(--radius)]",
        "text-[14px] font-medium transition-all duration-150",
        isActive
          ? "bg-[var(--primary-muted)] text-[var(--primary)]"
          : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {isActive && (
        <span
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2",
            "w-[3px] h-5 rounded-full",
            "bg-[var(--primary)]"
          )}
          aria-hidden="true"
        />
      )}

      <Icon
        size={17}
        className={cn(
          "shrink-0 transition-colors duration-150",
          isActive
            ? "text-[var(--primary)]"
            : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
        )}
      />

      <span className="truncate">{item.label}</span>

      {item.badge && (
        <span
          className={cn(
            "ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
            "bg-[var(--primary)] text-white leading-none"
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function SystemStatus() {
  return (
    <div
      className={cn(
        "mx-3 mb-3 px-4 py-3 rounded-[var(--radius)]",
        "border border-[var(--border-subtle)] bg-[var(--surface-elevated)]"
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full",
              "bg-[var(--success)] opacity-60"
            )}
          />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-[var(--success)]">
            System Online
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            All operators ready
          </span>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40",
        "flex flex-col",
        "w-[var(--sidebar-width)]",
        "bg-[var(--surface)] border-r border-[var(--border)]",
        "overflow-hidden transition-colors duration-200"
      )}
    >
      <MoeLogo />

      <div className="px-5 pt-4 pb-2">
        <span className="text-[11px] font-semibold text-[var(--text-disabled)] tracking-[0.14em] uppercase">
          Navigation
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto py-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
        ))}
      </nav>

      <SystemStatus />
    </aside>
  );
}
