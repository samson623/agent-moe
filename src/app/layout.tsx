import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0c0d14" },
    { media: "(prefers-color-scheme: light)", color: "#f5f6fa" },
  ],
  colorScheme: "dark light",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLoginRoute = pathname === "/login";

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {isLoginRoute ? children : <AppShell>{children}</AppShell>}
      </body>
    </html>
  );
}
