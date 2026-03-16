"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Moon, Sun, User, Menu, X, Zap, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceId } from "@/lib/hooks/use-workspace-id";
import { PendingApprovalsBadge } from "@/features/command-center/components/PendingApprovalsBadge";
import { useApprovalCount } from "@/features/command-center/hooks/use-approval-count";
import { useTheme } from "./ThemeProvider";
import { NAV_ITEMS } from "./Sidebar";

/* ------------------------------------------------------------------ */
/* Page title map                                                      */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Action buttons                                                      */
/* ------------------------------------------------------------------ */

const ACTION_BTN = cn(
  "inline-flex h-8 w-8 items-center justify-center rounded-lg",
  "text-[var(--text-muted)] hover:text-[var(--text)]",
  "hover:bg-[var(--surface-hover)]",
  "transition-colors duration-150"
);

function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className={ACTION_BTN}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
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
      className={cn(ACTION_BTN, "relative")}
      aria-label={`Notifications${approvalCount > 0 ? ` - ${approvalCount} pending` : ""}`}
    >
      <Bell size={15} />
      <PendingApprovalsBadge count={approvalCount} isLoading={approvalsLoading} />
    </button>
  );
}

function UserAvatar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setOpen(false);
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(ACTION_BTN, "w-8 h-8")}
        aria-label="User menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white">
          <User size={11} />
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className={cn(
              "absolute right-0 top-full mt-1 z-50",
              "w-44 rounded-[var(--radius)] border border-[var(--border)]",
              "bg-[var(--surface)] shadow-lg py-1",
              "animate-fade-in"
            )}
          >
            <button
              type="button"
              onClick={handleSignOut}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2 text-[13px] font-medium",
                "text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-muted)]",
                "transition-colors duration-150"
              )}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile sign-out button                                              */
/* ------------------------------------------------------------------ */

function MobileSignOutButton({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  async function handleSignOut() {
    onClose();
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg",
        "text-[13px] font-medium transition-colors duration-150",
        "text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-muted)]"
      )}
    >
      <LogOut size={16} className="shrink-0" />
      <span>Sign Out</span>
    </button>
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

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ animation: "backdrop-in 0.2s ease forwards" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-72",
          "bg-[var(--background)] border-r border-[var(--border)]",
          "flex flex-col animate-slide-in"
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
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

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
                    : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
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
        <div className="px-3 py-3 border-t border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-xs md:text-sm px-2">
            <span className="text-[var(--text-muted)]">Execution policy</span>
            <span className="text-[var(--success)] font-medium">
              Approval-first
            </span>
          </div>
          <MobileSignOutButton onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TopBar — Glass header                                               */
/* ------------------------------------------------------------------ */

export function TopBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { workspaceId } = useWorkspaceId();
  const { count: approvalCount, isLoading: approvalsLoading } =
    useApprovalCount(workspaceId ?? "");

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <>
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
            onClick={() => setMobileMenuOpen(true)}
            className={cn(ACTION_BTN, "lg:hidden")}
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>

          {/* Mobile logo */}
          <Link href="/" className="lg:hidden" aria-label="Home">
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

        {/* Right side — actions */}
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <NotificationButton
            approvalCount={approvalCount}
            approvalsLoading={approvalsLoading}
          />
          <UserAvatar />
        </div>
      </header>

      <MobileMenu open={mobileMenuOpen} onClose={closeMobileMenu} />
    </>
  );
}
