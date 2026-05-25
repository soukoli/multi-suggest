"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { FacilityWithMeta } from "@/lib/types";
import { FacilityListItem } from "./FacilityListItem";
import { ICONS } from "@/lib/icons";

const MapView = dynamic(() => import("@/components/MapView").then(m => ({ default: m.MapView })), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted/50 animate-pulse" />,
});

interface MapListViewProps {
  facilities: FacilityWithMeta[];
  isLoading?: boolean;
  headerContent?: React.ReactNode;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  emptyState?: React.ReactNode;
}

export function MapListView({
  facilities,
  isLoading,
  headerContent,
  isFavorite,
  onToggleFavorite,
  emptyState,
}: MapListViewProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const handleMarkerClick = useCallback((facilityId: string) => {
    setFocusedId(facilityId);
    setTimeout(() => {
      const el = document.getElementById(`facility-${facilityId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-foreground/20");
        setTimeout(() => el.classList.remove("ring-2", "ring-foreground/20"), 2500);
      }
    }, 100);
  }, []);

  const handleShowOnMap = useCallback((facility: FacilityWithMeta) => {
    setFocusedId(facility.id);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] overflow-hidden bg-background">
      {/* Map - full width, no padding, no rounded */}
      <div className="h-[30dvh] min-h-[150px] max-h-[250px] shrink-0">
        {!isLoading && facilities.length > 0 ? (
          <MapView
            facilities={facilities}
            focusedId={focusedId}
            onMarkerClick={handleMarkerClick}
            className="h-full w-full"
          />
        ) : (
          <div className="h-full w-full bg-muted/30 flex items-center justify-center">
            {isLoading ? (
              <Icon icon={ICONS.spinner} width={20} height={20} className="animate-spin text-muted-foreground" />
            ) : (
              <span className="text-xs text-muted-foreground/60">Žádná místa k zobrazení</span>
            )}
          </div>
        )}
      </div>

      {/* Glass separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* List section - scrollable, glass background */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {headerContent}

        <div className="flex flex-col gap-2 px-3 pb-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Icon icon={ICONS.spinner} width={20} height={20} className="animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && facilities.length === 0 && emptyState}

          {facilities.map((facility) => (
            <div
              key={facility.id}
              id={`facility-${facility.id}`}
              className="transition-all duration-300 rounded-2xl"
            >
              <FacilityListItem
                facility={facility}
                isFavorite={isFavorite(facility.id)}
                onToggleFavorite={() => onToggleFavorite(facility.id)}
                onShowOnMap={() => handleShowOnMap(facility)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
