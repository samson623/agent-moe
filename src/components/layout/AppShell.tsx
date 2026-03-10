import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ThemeProvider } from "./ThemeProvider";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ThemeProvider>
      <div className="min-h-dvh transition-colors duration-200">
        <Sidebar />
        <main className="min-h-dvh flex flex-col lg:ml-[calc(var(--sidebar-width)+24px)] lg:mr-3 lg:my-3">
          <div className="flex-1 flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)] overflow-hidden">
            <TopBar />
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
