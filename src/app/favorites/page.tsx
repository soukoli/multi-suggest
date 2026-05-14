"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useFacilities } from "@/hooks/useFacilities";
import { useLocationStore } from "@/store/useLocationStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MapSheetLayout } from "@/components/MapSheetLayout";
import { CrowdBadge } from "@/components/CrowdBadge";
import { getPlaceholderImage } from "@/lib/placeholders";
import { formatDistance } from "@/lib/geo";
import { ICONS } from "@/lib/icons";
import { CARD_LABELS } from "@/lib/types";

// Dynamic import for MapView (no SSR)
const MapView = dynamic(() => import("@/components/MapView").then(m => ({ default: m.MapView })), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
});

export default function FavoritesPage() {
  const { requestLocation } = useLocationStore();
  const { favorites, removeFavorite } = useFavoritesStore();
  const { data } = useFacilities();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Get all facilities that are in favorites
  let favoriteFacilities =
    data?.facilities?.filter((f) => favorites.includes(f.id)) || [];

  // Apply local search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    favoriteFacilities = favoriteFacilities.filter((f) =>
      f.name.toLowerCase().includes(q) ||
      f.address.toLowerCase().includes(q) ||
      (f.activity_summary || "").toLowerCase().includes(q) ||
      f.activities.some((a) => a.toLowerCase().includes(q))
    );
  }

  const mapContent = (
    <div className="h-full w-full relative">
      {favoriteFacilities.length > 0 ? (
        <MapView facilities={favoriteFacilities} className="h-full w-full" />
      ) : (
        <div className="h-full w-full bg-muted flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Přidej oblíbená místa</span>
        </div>
      )}
      {/* Floating header */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-3 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-lg font-bold tracking-tight text-foreground drop-shadow-sm">Favorites</h1>
          <p className="text-[10px] text-muted-foreground">{favorites.length} uložených</p>
        </div>
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <MapSheetLayout mapContent={mapContent}>
      {/* Search */}
      {favorites.length > 0 && (
        <div className="px-4 pb-2 pt-1">
          <div className="relative">
            <Icon icon={ICONS.search} width={16} height={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat v oblíbených..."
              className="w-full rounded-full bg-secondary py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <Icon icon={ICONS.close} width={16} height={16} className="text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {favorites.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 px-4">
          <Icon icon={ICONS.heartBroken} width={36} height={36} className="text-muted-foreground/40" />
          <p className="text-center text-sm text-muted-foreground">
            Zatím nemáš žádná oblíbená místa.
            <br />
            Ulož si je srdíčkem z Discover nebo Nearby.
          </p>
        </div>
      )}

      {/* No results */}
      {favoriteFacilities.length === 0 && favorites.length > 0 && searchQuery && (
        <p className="py-10 text-center text-sm text-muted-foreground px-4">
          Žádné výsledky pro &quot;{searchQuery}&quot;
        </p>
      )}

      {/* List */}
      <div className="flex flex-col gap-2.5 px-4 pb-4">
        {favoriteFacilities.map((facility) => {
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;
          const cardNames = facility.active_cards?.map(c => CARD_LABELS[c.id] || c.name) || [];
          const facilityLink = facility.website_url || facility.facebook_url || facility.instagram_url;

          return (
            <div
              key={facility.id}
              className="flex gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
            >
              <a href={facilityLink || mapsUrl} target="_blank" rel="noopener noreferrer" className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-muted">
                <img src={facility.image_url || getPlaceholderImage(facility.id, facility.category)} alt={facility.name} className="h-full w-full object-cover" loading="lazy" />
              </a>

              <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <a href={facilityLink || mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold leading-tight hover:underline truncate">
                      {facility.name}
                    </a>
                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                      {formatDistance(facility.distance)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {!facility.additional_payment ? (
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Zdarma</span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400">Příplatek</span>
                    )}
                    {facility.kids_activities && (
                      <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600 dark:text-blue-400">Děti</span>
                    )}
                    {facility.parking === "Yes" && (
                      <span className="rounded-full bg-foreground/8 px-1.5 py-0.5 text-[9px] font-bold text-foreground">P</span>
                    )}
                    {cardNames.length > 0 && (
                      <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">{cardNames.join(" · ")}</span>
                    )}
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <CrowdBadge level={facility.crowdLevel} />
                  <div className="flex gap-1">
                    <button onClick={() => removeFavorite(facility.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary transition-colors">
                      <Icon icon={ICONS.heartFilled} width={12} height={12} className="text-red-500" />
                    </button>
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background">
                      <Icon icon={ICONS.navigate} width={12} height={12} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </MapSheetLayout>
  );
}
