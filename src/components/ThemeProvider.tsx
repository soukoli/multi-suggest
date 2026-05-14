"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";

/**
 * Applies theme class to <html> based on store preference or system default.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      let isDark: boolean;
      if (theme === "system") {
        isDark = mediaQuery.matches;
      } else {
        isDark = theme === "dark";
      }
      document.documentElement.classList.toggle("dark", isDark);
    }

    applyTheme();

    const handler = () => applyTheme();
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  return <>{children}</>;
}
