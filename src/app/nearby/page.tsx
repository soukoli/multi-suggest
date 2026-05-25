"use client";

import { useFacilities } from "@/hooks/useFacilities";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { CategoryPills } from "@/components/CategoryPills";
import { RadiusSlider } from "@/components/RadiusSlider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SyncBadge } from "@/components/SyncBadge";
import { MapListView } from "@/components/MapListView";

export default function NearbyPage() {
  const { data, isLoading } = useFacilities();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  const facilities = data?.facilities || [];

  const headerContent = (
    <>
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight">Nearby</h1>
          <SyncBadge lastSync={data?.meta?.last_sync} />
        </div>
        <ThemeToggle />
      </div>
      <CategoryPills />
      <RadiusSlider totalResults={data?.meta?.total} />
    </>
  );

  return (
    <MapListView
      facilities={facilities}
      isLoading={isLoading}
      headerContent={headerContent}
      isFavorite={isFavorite}
      onToggleFavorite={toggleFavorite}
      emptyState={
        <p className="py-10 text-center text-sm text-muted-foreground">
          Žádná místa poblíž
        </p>
      }
    />
  );
}
