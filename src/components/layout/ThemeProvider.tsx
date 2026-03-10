"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("moe-theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      applyTheme(stored);
    }
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("moe-theme", next);
      applyTheme(next);
      return next;
    });
  }, []);

  // Prevent flash — keep server-rendered "dark" until client mounts
  if (!mounted) {
    return <ThemeContext.Provider value={{ theme: "dark", toggle }}>{children}</ThemeContext.Provider>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  // Add smooth transition class
  html.classList.add("theme-transition");
  html.classList.remove("light", "dark");
  html.classList.add(theme);
  // Remove transition class after animation completes
  setTimeout(() => html.classList.remove("theme-transition"), 350);
}
