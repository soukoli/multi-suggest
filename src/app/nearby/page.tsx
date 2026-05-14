"use client";

import { useEffect } from "react";
import { Icon } from "@iconify/react";
import { useFacilities } from "@/hooks/useFacilities";
import { useLocationStore } from "@/store/useLocationStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { CategoryPills } from "@/components/CategoryPills";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CrowdBadge } from "@/components/CrowdBadge";
import { formatDistance } from "@/lib/geo";
import { getPlaceholderImage } from "@/lib/placeholders";
import { ICONS } from "@/lib/icons";
import { CARD_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function NearbyPage() {
  const { requestLocation } = useLocationStore();
  const { data, isLoading } = useFacilities();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nearby</h1>
          <p className="text-xs text-muted-foreground">
            Seřazeno podle vzdálenosti
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* Category filter */}
      <CategoryPills />

      {/* List */}
      <div className="flex flex-col gap-3 px-4 pt-2 pb-4">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Icon icon={ICONS.spinner} width={24} height={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {data?.facilities?.map((facility) => {
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;
          const fav = isFavorite(facility.id);
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
                  {/* Card types + badges */}
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
                  </div>
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                  <CrowdBadge level={facility.crowdLevel} />

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => toggleFavorite(facility.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary transition-colors"
                    >
                      <Icon
                        icon={fav ? ICONS.heartFilled : ICONS.heart}
                        width={14}
                        height={14}
                        className={cn(
                          fav ? "text-red-500" : "text-muted-foreground"
                        )}
                      />
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

        {data?.facilities?.length === 0 && (
          <p className="py-20 text-center text-muted-foreground">
            Žádná místa poblíž
          </p>
        )}
      </div>
    </div>
  );
}
