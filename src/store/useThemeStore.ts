"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const current = get().theme;
        if (current === "system") {
          // If system, toggle to opposite of current system preference
          const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          set({ theme: isDark ? "light" : "dark" });
        } else {
          set({ theme: current === "dark" ? "light" : "dark" });
        }
      },
    }),
    {
      name: "multisuggest-theme",
    }
  )
);
