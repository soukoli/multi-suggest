"use client";

import { useEffect } from "react";
import { useFacilities } from "@/hooks/useFacilities";
import { useLocationStore } from "@/store/useLocationStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { CategoryPills } from "@/components/CategoryPills";
import { CrowdBadge } from "@/components/CrowdBadge";
import { formatDistance } from "@/lib/geo";
import { getPlaceholderImage } from "@/lib/placeholders";
import { Heart, Navigation, Loader2 } from "lucide-react";
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
      <header className="px-4 pt-4 pb-1">
        <h1 className="text-2xl font-bold tracking-tight">Nearby</h1>
        <p className="text-sm text-muted-foreground">
          Seřazeno podle vzdálenosti
        </p>
      </header>

      {/* Category filter */}
      <CategoryPills />

      {/* List */}
      <div className="flex flex-col gap-3 px-4 pt-2">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {data?.facilities?.map((facility) => {
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;
          const fav = isFavorite(facility.id);

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
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                  <CrowdBadge level={facility.crowdLevel} />

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => toggleFavorite(facility.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary transition-colors"
                    >
                      <Heart
                        className={cn(
                          "h-3.5 w-3.5",
                          fav
                            ? "fill-red-500 text-red-500"
                            : "text-muted-foreground"
                        )}
                      />
                    </button>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-90"
                    >
                      <Navigation className="h-3.5 w-3.5" />
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
