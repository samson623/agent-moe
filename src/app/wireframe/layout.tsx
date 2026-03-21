"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Map,
  FileText,
  Film,
  Users,
  ShieldCheck,
  TrendingUp,
  Globe,
  DollarSign,
  Rocket,
  Link as LinkIcon,
  BarChart2,
  Settings,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types & data                                                        */
/* ------------------------------------------------------------------ */

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_GROUPS: NavItem[][] = [
  [
    { href: "/wireframe", label: "Command Center", icon: LayoutDashboard },
    { href: "/wireframe/missions", label: "Missions", icon: Map },
    { href: "/wireframe/content", label: "Content", icon: FileText },
    { href: "/wireframe/video", label: "Video", icon: Film },
  ],
  [
    { href: "/wireframe/operators", label: "Operators", icon: Users },
    { href: "/wireframe/approvals", label: "Approvals", icon: ShieldCheck },
    { href: "/wireframe/growth", label: "Growth", icon: TrendingUp },
    { href: "/wireframe/browser", label: "Browser", icon: Globe },
  ],
  [
    { href: "/wireframe/revenue", label: "Revenue", icon: DollarSign },
    { href: "/wireframe/launchpad", label: "Launchpad", icon: Rocket },
    { href: "/wireframe/connectors", label: "Connectors", icon: LinkIcon },
    { href: "/wireframe/analytics", label: "Analytics", icon: BarChart2 },
  ],
];

const SETTINGS_ITEM: NavItem = {
  href: "/wireframe/settings",
  label: "Settings",
  icon: Settings,
};

const ALL_NAV_ITEMS: NavItem[] = [...NAV_GROUPS.flat(), SETTINGS_ITEM];

/* ------------------------------------------------------------------ */
/* Page title map                                                      */
/* ------------------------------------------------------------------ */

const PAGE_TITLES: Record<string, string> = {
  "/wireframe": "Command Center",
  "/wireframe/missions": "Missions",
  "/wireframe/content": "Content Studio",
  "/wireframe/video": "Video Studio",
  "/wireframe/operators": "Operators",
  "/wireframe/approvals": "Approvals",
  "/wireframe/growth": "Growth Engine",
  "/wireframe/browser": "Browser Agent",
  "/wireframe/revenue": "Revenue Lab",
  "/wireframe/launchpad": "Launchpad",
  "/wireframe/connectors": "Connectors",
  "/wireframe/analytics": "Analytics",
  "/wireframe/settings": "Settings",
};

function getTitle(pathname: string) {
  const match = Object.keys(PAGE_TITLES).find((key) =>
    key !== "/wireframe" ? pathname.startsWith(key) : pathname === key
  );
  return match ? PAGE_TITLES[match] : "Command Center";
}

/* ------------------------------------------------------------------ */
/* Nav link                                                            */
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
/* Mobile slide-out menu                                               */
/* ------------------------------------------------------------------ */

function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  function isActive(href: string): boolean {
    if (href === "/wireframe") return pathname === "/wireframe";
    return pathname.startsWith(href);
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-72",
          "bg-[var(--background)] border-r border-[var(--border)]",
          "flex flex-col",
          "transition-transform duration-300 ease-out"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg",
                "bg-[linear-gradient(135deg,var(--primary),var(--accent))]"
              )}
            >
              <Zap size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-[var(--text)]">
              Agent MOE
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-lg",
              "text-[var(--text-muted)] hover:text-[var(--text)]",
              "hover:bg-[var(--surface-hover)] transition-colors"
            )}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {ALL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                  "text-[13px] font-medium transition-colors duration-150",
                  active
                    ? "bg-[var(--primary-muted)] text-[var(--primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  size={16}
                  className={cn(
                    "shrink-0",
                    active ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs px-2">
            <span className="text-[var(--text-muted)]">Mode</span>
            <span className="text-[var(--success)] font-medium">Wireframe</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

function WireframeSidebar() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/wireframe") return pathname === "/wireframe";
    return pathname.startsWith(href);
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
        <Link href="/wireframe" className="flex items-center gap-3" aria-label="Wireframe Home">
          <div
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-[10px] shrink-0",
              "bg-[linear-gradient(135deg,var(--primary),var(--accent))]"
            )}
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
        aria-label="Wireframe navigation"
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

      {/* Settings — pinned bottom */}
      <div className="px-3 pb-3 pt-2 border-t border-[var(--border-subtle)] space-y-0.5">
        <NavLink item={SETTINGS_ITEM} isActive={isActive("/wireframe/settings")} />
        <div className="flex items-center justify-between text-xs px-3 py-1.5">
          <span className="text-[var(--text-muted)]">Mode</span>
          <span className="text-[var(--success)] font-medium">Wireframe</span>
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Top bar — Glass header                                              */
/* ------------------------------------------------------------------ */

const ACTION_BTN = cn(
  "inline-flex h-8 w-8 items-center justify-center rounded-lg",
  "text-[var(--text-muted)] hover:text-[var(--text)]",
  "hover:bg-[var(--surface-hover)]",
  "transition-colors duration-150"
);

function WireframeTopBar({
  onOpenMenu,
}: {
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "sticky top-0 z-30",
        "flex items-center justify-between gap-4",
        "px-4 md:px-6 h-12",
        "bg-[var(--header-bg)] backdrop-blur-xl",
        "border-b border-[var(--border-subtle)]"
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onOpenMenu}
          className={cn(ACTION_BTN, "lg:hidden")}
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        {/* Mobile logo */}
        <Link href="/wireframe" className="lg:hidden" aria-label="Wireframe Home">
          <div
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-lg",
              "bg-[linear-gradient(135deg,var(--primary),var(--accent))]"
            )}
          >
            <Zap size={11} className="text-white" />
          </div>
        </Link>

        {/* Page title */}
        <h1 className="text-sm font-medium text-[var(--text-secondary)] truncate">
          {getTitle(pathname)}
        </h1>
      </div>

      {/* Right side — wireframe badge */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-md",
            "text-[11px] font-semibold uppercase tracking-wider",
            "bg-[var(--primary-muted)] text-[var(--primary)]",
            "border border-[var(--primary)]/20"
          )}
        >
          Wireframe
        </span>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

export default function WireframeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <>
      <WireframeSidebar />

      <main className="lg:ml-[220px] min-h-screen bg-[var(--background)] transition-colors duration-200">
        <WireframeTopBar onOpenMenu={() => setMobileMenuOpen(true)} />
        {children}
      </main>

      <MobileMenu open={mobileMenuOpen} onClose={closeMobileMenu} />
    </>
  );
}
