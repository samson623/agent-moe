import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ThemeProvider } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ThemeProvider>
      <div className="min-h-dvh bg-[var(--background)] transition-colors duration-200">
        <Sidebar />
        <TopBar />
        <main
          className={cn(
            "ml-[var(--sidebar-width)] pt-[var(--topbar-height)]",
            "min-h-dvh overflow-y-auto"
          )}
        >
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </ThemeProvider>
  );
}
