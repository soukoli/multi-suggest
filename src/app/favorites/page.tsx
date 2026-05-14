"use client";

import { useEffect } from "react";
import { Icon } from "@iconify/react";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useFacilities } from "@/hooks/useFacilities";
import { useLocationStore } from "@/store/useLocationStore";
import { CrowdBadge } from "@/components/CrowdBadge";
import { getPlaceholderImage } from "@/lib/placeholders";
import { formatDistance } from "@/lib/geo";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";

export default function FavoritesPage() {
  const { requestLocation } = useLocationStore();
  const { favorites, removeFavorite } = useFavoritesStore();
  const { data } = useFacilities();

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const favoriteFacilities =
    data?.facilities?.filter((f) => favorites.includes(f.id)) || [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="px-4 pt-4 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>
        <p className="text-sm text-muted-foreground">
          {favoriteFacilities.length} uložených míst
        </p>
      </header>

      {/* List */}
      <div className="flex flex-col gap-3 px-4">
        {favoriteFacilities.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20">
            <Icon icon={ICONS.heartBroken} width={40} height={40} className="text-muted-foreground/50" />
            <p className="text-center text-muted-foreground">
              Zatím nemáš žádná oblíbená místa.
              <br />
              Srdíčkem si je ulož z Discover nebo Nearby.
            </p>
          </div>
        )}

        {favoriteFacilities.map((facility) => {
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;

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
