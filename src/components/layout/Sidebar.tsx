"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types & data                                                        */
/* ------------------------------------------------------------------ */

export type AppRoute =
  | "/"
  | "/missions"
  | "/content"
  | "/video"
  | "/operators"
  | "/approvals"
  | "/growth"
  | "/browser"
  | "/revenue"
  | "/launchpad"
  | "/connectors"
  | "/analytics"
  | "/settings";

interface NavItem {
  href: AppRoute;
  label: string;
  icon: LucideIcon;
}

const NAV_GROUPS: NavItem[][] = [
  [
    { href: "/", label: "Command Center", icon: LayoutDashboard },
    { href: "/missions", label: "Missions", icon: Map },
    { href: "/content", label: "Content", icon: FileText },
    { href: "/video", label: "Video", icon: Film },
  ],
  [
    { href: "/operators", label: "Operators", icon: Users },
    { href: "/approvals", label: "Approvals", icon: ShieldCheck },
    { href: "/growth", label: "Growth", icon: TrendingUp },
    { href: "/browser", label: "Browser", icon: Globe },
  ],
  [
    { href: "/revenue", label: "Revenue", icon: DollarSign },
    { href: "/launchpad", label: "Launchpad", icon: Rocket },
    { href: "/connectors", label: "Connectors", icon: LinkIcon },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
  ],
];

const SETTINGS_ITEM: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
};

/** Flat list exported for mobile menu in TopBar */
export const NAV_ITEMS: NavItem[] = [...NAV_GROUPS.flat(), SETTINGS_ITEM];

/* ------------------------------------------------------------------ */
/* Nav link with icon + label                                          */
/* ------------------------------------------------------------------ */

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 py-2 px-3",
        "rounded-[var(--radius-sm)] transition-all duration-150",
        isActive
          ? "bg-[var(--primary-muted)] text-[var(--primary)]"
          : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Active indicator — left edge bar with glow */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-[var(--primary)]"
          style={{ boxShadow: "0 0 8px var(--primary)" }}
        />
      )}

      <Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} className="shrink-0" />
      <span className="text-[13px] font-medium truncate">{item.label}</span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40",
        "hidden lg:flex flex-col",
        "w-[220px]",
        "border-r border-[var(--border-subtle)]",
        "bg-[var(--background)]",
        "transition-colors duration-200"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 shrink-0 mt-1 mb-1">
        <Link href="/" className="flex items-center gap-3" aria-label="Home">
          <div
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-[10px] shrink-0",
              "bg-[linear-gradient(135deg,var(--primary),var(--accent))]"
            )}
            style={{ animation: "logo-breathe 3s ease-in-out infinite" }}
          >
            <Zap size={15} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold text-[var(--text)] tracking-tight">
            Agent MOE
          </span>
        </Link>
      </div>

      {/* Nav groups */}
      <nav
        className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto"
        aria-label="Main navigation"
      >
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {gi > 0 && (
              <div className="h-px bg-[var(--border-subtle)] my-2 mx-1" />
            )}
            {group.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Settings + Sign Out — pinned bottom */}
      <div className="px-3 pb-3 pt-2 border-t border-[var(--border-subtle)] space-y-0.5">
        <NavLink item={SETTINGS_ITEM} isActive={isActive("/settings")} />
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "group relative flex items-center gap-3 py-2 px-3 w-full",
            "rounded-[var(--radius-sm)] transition-all duration-150",
            "text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-muted)]"
          )}
        >
          <LogOut size={18} strokeWidth={1.7} className="shrink-0" />
          <span className="text-[13px] font-medium truncate">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
