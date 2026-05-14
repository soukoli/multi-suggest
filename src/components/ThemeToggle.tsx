"use client";

import { Icon } from "@iconify/react";
import { useThemeStore } from "@/store/useThemeStore";
import { ICONS } from "@/lib/icons";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (theme === "system") {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    } else {
      setIsDark(theme === "dark");
    }
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary active:scale-95"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon
        icon={isDark ? ICONS.sun : ICONS.moon}
        width={20}
        height={20}
        className="text-foreground"
      />
    </button>
  );
}
