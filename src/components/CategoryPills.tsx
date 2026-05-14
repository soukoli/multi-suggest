"use client";

import { Icon } from "@iconify/react";
import { useFilterStore } from "@/store/useFilterStore";
import { Category, CATEGORY_LABELS } from "@/lib/types";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";

const categories: Category[] = [
  "fitness",
  "group",
  "swimming",
  "wellness",
  "yoga",
  "sports",
  "climbing",
  "outdoor",
  "kids",
];

export function CategoryPills() {
  const {
    activeCategory,
    setCategory,
    freeOnly,
    setFreeOnly,
    kidsOnly,
    setKidsOnly,
    parkingOnly,
    setParkingOnly,
    searchQuery,
    setSearchQuery,
    filtersOpen,
    setFiltersOpen,
    clearFilters,
  } = useFilterStore();

  const activeFilterCount = useFilterStore((s) => s.activeFilterCount());

  return (
    <div className="flex flex-col gap-2 px-4 py-2">
      {/* Search bar + filter button */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Icon
            icon={ICONS.search}
            width={16}
            height={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat místo..."
            className="w-full rounded-full bg-secondary py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Icon icon={ICONS.close} width={16} height={16} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={cn(
            "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all active:scale-95",
            filtersOpen || activeFilterCount > 0
              ? "bg-foreground text-background"
              : "bg-secondary text-muted-foreground"
          )}
        >
          <Icon icon={ICONS.filter} width={18} height={18} />
          {activeFilterCount > 0 && !filtersOpen && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background ring-2 ring-background">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel (expandable) */}
      {filtersOpen && (
        <div className="flex flex-col gap-3 rounded-2xl bg-secondary/50 p-3">
          {/* Category grid */}
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Kategorie
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => setCategory(null)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-center transition-all",
                  activeCategory === null
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-[11px] font-medium">Vše</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(activeCategory === cat ? null : cat)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-center transition-all",
                    activeCategory === cat
                      ? "bg-foreground text-background"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon icon={ICONS[cat]} width={16} height={16} />
                  <span className="text-[10px] font-medium leading-tight">
                    {CATEGORY_LABELS[cat]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle filters */}
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Vlastnosti
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFreeOnly(!freeOnly)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  freeOnly
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground"
                )}
              >
                <Icon icon={ICONS.freeEntry} width={12} height={12} />
                Bez příplatku
              </button>
              <button
                onClick={() => setKidsOnly(!kidsOnly)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  kidsOnly
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground"
                )}
              >
                <Icon icon={ICONS.kids} width={12} height={12} />
                Pro děti
              </button>
              <button
                onClick={() => setParkingOnly(!parkingOnly)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  parkingOnly
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground"
                )}
              >
                <span className="text-[10px] font-bold">P</span>
                Parkování
              </button>
            </div>
          </div>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="self-start text-xs font-medium text-muted-foreground underline underline-offset-2"
            >
              Zrušit filtry
            </button>
          )}
        </div>
      )}

      {/* Active filters display (when panel is closed) */}
      {!filtersOpen && activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeCategory && (
            <span className="flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-1 text-[11px] font-medium text-foreground">
              <Icon icon={ICONS[activeCategory]} width={11} height={11} />
              {CATEGORY_LABELS[activeCategory]}
              <button onClick={() => setCategory(null)} className="ml-0.5 opacity-60 hover:opacity-100">
                ×
              </button>
            </span>
          )}
          {freeOnly && (
            <span className="flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-1 text-[11px] font-medium text-foreground">
              Bez příplatku
              <button onClick={() => setFreeOnly(false)} className="ml-0.5 opacity-60 hover:opacity-100">
                ×
              </button>
            </span>
          )}
          {kidsOnly && (
            <span className="flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-1 text-[11px] font-medium text-foreground">
              Pro děti
              <button onClick={() => setKidsOnly(false)} className="ml-0.5 opacity-60 hover:opacity-100">
                ×
              </button>
            </span>
          )}
          {parkingOnly && (
            <span className="flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-1 text-[11px] font-medium text-foreground">
              Parkování
              <button onClick={() => setParkingOnly(false)} className="ml-0.5 opacity-60 hover:opacity-100">
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
