"use client";

import { Icon } from "@iconify/react";
import { useThemeStore } from "@/store/useThemeStore";
import { ICONS } from "@/lib/icons";
import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};

const getSystemDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const systemDark = useSyncExternalStore(subscribe, getSystemDark, () => false);
  const isDark = theme === "system" ? systemDark : theme === "dark";

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
