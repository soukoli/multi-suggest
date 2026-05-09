"use client";

import { useFilterStore } from "@/store/useFilterStore";
import { Category, CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Dumbbell, Waves, Flame, Heart, Ship, MapPin } from "lucide-react";

const CATEGORY_ICON_MAP = {
  fitness: Dumbbell,
  swimming: Waves,
  wellness: Flame,
  yoga: Heart,
  water: Ship,
  other: MapPin,
};

const categories: (Category | null)[] = [
  null,
  "fitness",
  "swimming",
  "wellness",
  "yoga",
  "water",
];

export function CategoryPills() {
  const { activeCategory, setCategory } = useFilterStore();

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
      {categories.map((cat) => {
        const isActive = activeCategory === cat;
        const Icon = cat ? CATEGORY_ICON_MAP[cat] : null;
        const label = cat ? CATEGORY_LABELS[cat] : "Vše";

        return (
          <button
            key={cat || "all"}
            onClick={() => setCategory(cat)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-foreground text-background shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
