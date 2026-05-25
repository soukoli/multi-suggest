"use client";

import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { useFacilities } from "@/hooks/useFacilities";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { CategoryPills } from "@/components/CategoryPills";
import { RadiusSlider } from "@/components/RadiusSlider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MapSheetLayout } from "@/components/MapSheetLayout";
import { FacilityListItem } from "@/components/FacilityListItem";
import { ICONS } from "@/lib/icons";

const MapView = dynamic(() => import("@/components/MapView").then(m => ({ default: m.MapView })), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
});

export default function NearbyPage() {
  const { data, isLoading } = useFacilities();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

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
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-3 pointer-events-none">
        <h1 className="text-lg font-bold tracking-tight text-foreground pointer-events-auto">Nearby</h1>
        <div className="pointer-events-auto"><ThemeToggle /></div>
      </div>
    </div>
  );

  return (
    <MapSheetLayout mapContent={mapContent}>
      <CategoryPills />

      <RadiusSlider totalResults={data?.meta?.total} />

      <div className="flex flex-col gap-2.5 px-4 pb-4">
        {isLoading && (
          <div className="flex justify-center py-10">
            <Icon icon={ICONS.spinner} width={20} height={20} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {facilities.map((facility) => (
          <FacilityListItem
            key={facility.id}
            facility={facility}
            isFavorite={isFavorite(facility.id)}
            onToggleFavorite={() => toggleFavorite(facility.id)}
          />
        ))}

        {facilities.length === 0 && !isLoading && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Žádná místa poblíž
          </p>
        )}
      </div>
    </MapSheetLayout>
  );
}
