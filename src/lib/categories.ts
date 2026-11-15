import type { Category } from "./types";

// Court-paint palette: each category reads on both the chalk and the night map.
export const CATEGORIES: { id: Category; label: string; color: string; icon: string }[] = [
  { id: "fitness", label: "Posilovny", color: "#F25C3B", icon: "M6 9v6M18 9v6M3 11v2M21 11v2M6 12h12" },
  { id: "swimming", label: "Bazény", color: "#1FA6E0", icon: "M3 15c2 0 2-1.5 4.5-1.5S9.5 15 12 15s2-1.5 4.5-1.5S19 15 21 15M3 19c2 0 2-1.5 4.5-1.5S9.5 19 12 19s2-1.5 4.5-1.5S19 19 21 19M8 11V6a2 2 0 0 1 4 0M12 11V8" },
  { id: "wellness", label: "Wellness", color: "#B784E0", icon: "M8 4c-1 2 1 3 0 5M12 4c-1 2 1 3 0 5M16 4c-1 2 1 3 0 5M4 13h16l-1.5 6h-13z" },
  { id: "yoga", label: "Jóga a pilates", color: "#3CC48E", icon: "M12 5a1.5 1.5 0 1 0 0 .01M12 8v5M5 11l7 2 7-2M8 19l4-6 4 6" },
  { id: "group", label: "Lekce a tanec", color: "#FF5FA2", icon: "M8 7a2 2 0 1 0 0 .01M16 7a2 2 0 1 0 0 .01M4 19v-3a4 4 0 0 1 8 0v3M12 19v-3a4 4 0 0 1 8 0v3" },
  { id: "racket", label: "Raketové sporty", color: "#B5CF1F", icon: "M14.5 9.5a5 5 0 1 0-.01 0M11 13l-6 6M17 17a1.5 1.5 0 1 0 0 .01" },
  { id: "climbing", label: "Lezení", color: "#B08463", icon: "M3 20l6-11 4 6 3-4 5 9z" },
  { id: "outdoor", label: "Ostatní sporty", color: "#5B8DEF", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3.5 9h17M3.5 15h17M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" },
  { id: "kids", label: "Pro děti", color: "#FF9F43", icon: "M12 6a2 2 0 1 0 0 .01M8 21l2-6-3-3 5-2 5 2-3 3 2 6" },
  { id: "other", label: "Nezařazené", color: "#8A9BA8", icon: "M12 8v.01M12 12v4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18" },
];

export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  Category,
  (typeof CATEGORIES)[number]
>;
