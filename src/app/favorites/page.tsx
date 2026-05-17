"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useFacilities } from "@/hooks/useFacilities";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MapSheetLayout } from "@/components/MapSheetLayout";
import { FacilityListItem } from "@/components/FacilityListItem";
import { ICONS } from "@/lib/icons";

const MapView = dynamic(() => import("@/components/MapView").then(m => ({ default: m.MapView })), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
});

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavoritesStore();
  const { data } = useFacilities();
  const [searchQuery, setSearchQuery] = useState("");

  let favoriteFacilities =
    data?.facilities?.filter((f) => favorites.includes(f.id)) || [];

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
          <span className="text-xs text-muted-foreground">Přidej oblíbená místa</span>
        </div>
      )}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-3 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-lg font-bold tracking-tight">Favorites</h1>
          <p className="text-[10px] text-muted-foreground">{favorites.length} uložených</p>
        </div>
        <div className="pointer-events-auto"><ThemeToggle /></div>
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
        {favoriteFacilities.map((facility) => (
          <FacilityListItem
            key={facility.id}
            facility={facility}
            isFavorite={true}
            onToggleFavorite={() => removeFavorite(facility.id)}
          />
        ))}
      </div>
    </MapSheetLayout>
  );
}
