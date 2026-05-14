"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useFacilities } from "@/hooks/useFacilities";
import { useLocationStore } from "@/store/useLocationStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CrowdBadge } from "@/components/CrowdBadge";
import { getPlaceholderImage } from "@/lib/placeholders";
import { formatDistance } from "@/lib/geo";
import { ICONS } from "@/lib/icons";
import { CARD_LABELS } from "@/lib/types";

export default function FavoritesPage() {
  const { requestLocation } = useLocationStore();
  const { favorites, removeFavorite } = useFavoritesStore();
  const { data } = useFacilities();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Get all facilities that are in favorites (from full dataset, not filtered)
  let favoriteFacilities =
    data?.facilities?.filter((f) => favorites.includes(f.id)) || [];

  // Apply local search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    favoriteFacilities = favoriteFacilities.filter((f) =>
      f.name.toLowerCase().includes(q) ||
      f.address.toLowerCase().includes(q) ||
      (f.activity_summary || "").toLowerCase().includes(q) ||
      f.activities.some((a) => a.toLowerCase().includes(q))
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>
          <p className="text-xs text-muted-foreground">
            {favorites.length} uložených míst
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* Search */}
      {favorites.length > 0 && (
        <div className="px-4 pb-2">
          <div className="relative">
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
              placeholder="Hledat v oblíbených..."
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
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-3 px-4 pb-4">
        {favorites.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20">
            <Icon icon={ICONS.heartBroken} width={40} height={40} className="text-muted-foreground/50" />
            <p className="text-center text-sm text-muted-foreground">
              Zatím nemáš žádná oblíbená místa.
              <br />
              Srdíčkem si je ulož z Discover nebo Nearby.
            </p>
          </div>
        )}

        {favoriteFacilities.length === 0 && favorites.length > 0 && searchQuery && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Žádné výsledky pro &quot;{searchQuery}&quot;
          </p>
        )}

        {favoriteFacilities.map((facility) => {
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;
          const cardNames = facility.active_cards?.map(c => CARD_LABELS[c.id] || c.name) || [];

          return (
            <div
              key={facility.id}
              className="flex gap-3 rounded-2xl border border-border/50 bg-card p-3 shadow-sm"
            >
              {/* Thumbnail */}
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                <img
                  src={facility.image_url || getPlaceholderImage(facility.id, facility.category)}
                  alt={facility.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold leading-tight">
                      {facility.name}
                    </h3>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistance(facility.distance)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {facility.address}
                  </p>
                  {/* Info badges */}
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {cardNames.slice(0, 3).map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                      >
                        {name}
                      </span>
                    ))}
                    {facility.additional_payment && (
                      <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-300">
                        + příplatek
                      </span>
                    )}
                    {facility.kids_activities && (
                      <Icon icon={ICONS.kids} width={12} height={12} className="text-muted-foreground" />
                    )}
                    {facility.parking === "Yes" && (
                      <span className="text-[10px] font-bold text-muted-foreground">P</span>
                    )}
                  </div>
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                  <CrowdBadge level={facility.crowdLevel} />

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => removeFavorite(facility.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary transition-colors"
                    >
                      <Icon icon={ICONS.heartFilled} width={14} height={14} className="text-red-500" />
                    </button>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-90"
                    >
                      <Icon icon={ICONS.navigate} width={14} height={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
