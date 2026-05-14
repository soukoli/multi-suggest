"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { useFacilities } from "@/hooks/useFacilities";
import { useLocationStore } from "@/store/useLocationStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { CategoryPills } from "@/components/CategoryPills";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MapSheetLayout } from "@/components/MapSheetLayout";
import { CrowdBadge } from "@/components/CrowdBadge";
import { formatDistance } from "@/lib/geo";
import { getPlaceholderImage } from "@/lib/placeholders";
import { ICONS } from "@/lib/icons";
import { CARD_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

// Dynamic import for MapView (no SSR)
const MapView = dynamic(() => import("@/components/MapView").then(m => ({ default: m.MapView })), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
});

export default function NearbyPage() {
  const { requestLocation } = useLocationStore();
  const { data, isLoading } = useFacilities();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const facilities = data?.facilities || [];

  const mapContent = (
    <div className="h-full w-full relative">
      {!isLoading && facilities.length > 0 ? (
        <MapView facilities={facilities} className="h-full w-full" />
      ) : (
        <div className="h-full w-full bg-muted flex items-center justify-center">
          {isLoading && <Icon icon={ICONS.spinner} width={24} height={24} className="animate-spin text-muted-foreground" />}
        </div>
      )}
      {/* Floating header on top of map */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-3 pointer-events-none">
        <h1 className="text-lg font-bold tracking-tight text-foreground drop-shadow-sm pointer-events-auto">Nearby</h1>
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <MapSheetLayout mapContent={mapContent}>
      {/* Filters */}
      <CategoryPills />

      {/* Results count */}
      {data?.meta && (
        <div className="px-4 pb-2">
          <span className="text-[11px] text-muted-foreground">
            {data.meta.total} míst v okruhu {data.meta.radius_km} km
          </span>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2.5 px-4 pb-4">
        {facilities.map((facility) => {
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;
          const fav = isFavorite(facility.id);
          const cardNames = facility.active_cards?.map(c => CARD_LABELS[c.id] || c.name) || [];
          const facilityLink = facility.website_url || facility.facebook_url || facility.instagram_url;

          return (
            <div
              key={facility.id}
              className="flex gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
            >
              {/* Thumbnail */}
              <a
                href={facilityLink || mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-muted"
              >
                <img
                  src={facility.image_url || getPlaceholderImage(facility.id, facility.category)}
                  alt={facility.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </a>

              {/* Content */}
              <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={facilityLink || mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-semibold leading-tight hover:underline truncate"
                    >
                      {facility.name}
                    </a>
                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                      {formatDistance(facility.distance)}
                    </span>
                  </div>
                  {/* Badges row */}
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {!facility.additional_payment ? (
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Zdarma
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                        Příplatek
                      </span>
                    )}
                    {facility.kids_activities && (
                      <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600 dark:text-blue-400">
                        Děti
                      </span>
                    )}
                    {facility.parking === "Yes" && (
                      <span className="rounded-full bg-foreground/8 px-1.5 py-0.5 text-[9px] font-bold text-foreground">P</span>
                    )}
                    {cardNames.length > 0 && (
                      <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                        {cardNames.join(" · ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <CrowdBadge level={facility.crowdLevel} />
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleFavorite(facility.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary transition-colors"
                    >
                      <Icon
                        icon={fav ? ICONS.heartFilled : ICONS.heart}
                        width={12} height={12}
                        className={fav ? "text-red-500" : "text-muted-foreground"}
                      />
                    </button>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background"
                    >
                      <Icon icon={ICONS.navigate} width={12} height={12} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {facilities.length === 0 && !isLoading && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Žádná místa poblíž
          </p>
        )}
      </div>
    </MapSheetLayout>
  );
}
