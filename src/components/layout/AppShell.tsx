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
      <Sidebar />
      <main className="min-h-dvh" style={{ marginLeft: 'var(--sidebar-width)' }}>
        <TopBar />
        {children}
      </main>
    </ThemeProvider>
  );
}
