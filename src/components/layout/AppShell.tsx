import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-[var(--background)]">
      {/* Sidebar — fixed left column */}
      <Sidebar />

      {/* Top bar — fixed, offset by sidebar width */}
      <TopBar />

      {/* Main content area — offset by sidebar + topbar */}
      <main
        className={cn(
          "ml-[var(--sidebar-width)] pt-[var(--topbar-height)]",
          "min-h-dvh overflow-y-auto"
        )}
      >
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
