import type { ReactNode } from "react";

/**
 * Login layout — overrides the root AppShell for the /login route.
 *
 * The root layout wraps everything with AppShell (sidebar + topbar).
 * This layout replaces that with a full-screen overlay using fixed positioning
 * and a higher z-index, so the login UI covers the shell completely.
 *
 * This is the correct Next.js App Router pattern for route-specific layouts
 * when you cannot restructure the root layout into route groups.
 */

export default function LoginLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "#0a0a0f",
        overflow: "auto",
      }}
    >
      {children}
    </div>
  );
}
