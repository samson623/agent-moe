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
    <div className="flex items-center gap-3 px-4 pt-5 pb-4 shrink-0">
      <div
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)]",
          "bg-[linear-gradient(135deg,var(--primary),var(--accent))]",
          "shadow-[0_0_20px_rgba(94,234,212,0.15)]"
        )}
      >
        <Zap size={16} className="text-[var(--text-inverse)]" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[15px] font-semibold tracking-tight text-[var(--text)] truncate">
          Agent MOE
        </span>
        <span className="text-[11px] text-[var(--text-muted)]">
          AI Operator Platform
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
        "group flex items-center gap-3 px-3 py-2 mx-2 rounded-[var(--radius-sm)]",
        "text-[13px] font-medium transition-colors duration-150",
        isActive
          ? "bg-[var(--primary-muted)] text-[var(--primary)]"
          : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon
        size={16}
        className={cn(
          "shrink-0 transition-colors duration-150",
          isActive
            ? "text-[var(--primary)]"
            : "text-[var(--text-muted)] group-hover:text-[var(--text)]"
        )}
      />
      <span className="truncate">{item.label}</span>
    </Link>
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
        "fixed left-3 top-3 bottom-3 z-40 hidden lg:flex",
        "flex flex-col",
        "w-[var(--sidebar-width)]",
        "rounded-[var(--radius-lg)] overflow-hidden",
        "border border-[var(--border)]",
        "bg-[var(--surface-solid)]",
        "transition-colors duration-200"
      )}
    >
      <MoeLogo />

      <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto py-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--text-muted)]">Execution policy</span>
          <span className="text-[var(--success)] font-medium">Approval-first</span>
        </div>
      </div>
    </aside>
  );
}
