"use client";

import { useEffect } from "react";

/**
 * Detects system color scheme preference and applies 'dark' class to <html>
 * Follows system preference automatically.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme(dark: boolean) {
      document.documentElement.classList.toggle("dark", dark);
    }

    // Initial application
    applyTheme(mediaQuery.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return <>{children}</>;
}
