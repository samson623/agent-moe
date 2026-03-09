import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: {
    default: "Agent Moe | AI Operator Platform",
    template: "%s | Agent Moe",
  },
  description:
    "Private AI operator platform — missions, operators, content, growth, revenue. One instruction, complete execution.",
  keywords: ["AI", "operator", "automation", "content", "growth", "revenue"],
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  colorScheme: "dark",
};

/**
 * Root layout — wraps all routes with AppShell (sidebar + topbar).
 *
 * Exception: /login uses src/app/login/layout.tsx which renders
 * a fixed full-screen overlay so the sidebar is not visible behind the login UI.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
