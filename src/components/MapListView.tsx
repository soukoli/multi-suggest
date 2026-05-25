"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { FacilityWithMeta } from "@/lib/types";
import { FacilityListItem } from "./FacilityListItem";
import { ICONS } from "@/lib/icons";

const MapView = dynamic(() => import("@/components/MapView").then(m => ({ default: m.MapView })), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
});

interface MapListViewProps {
  facilities: FacilityWithMeta[];
  isLoading?: boolean;
  headerContent?: React.ReactNode;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  emptyState?: React.ReactNode;
}

/**
 * Split view: map always visible on top (30%), scrollable list below.
 * 
 * Interactions:
 * - Click 🗺 button on list item → map zooms to that facility
 * - Click marker on map → scrolls list to that item + highlights it
 * - Click name/thumbnail → opens facility portal (external link)
 */
export function MapListView({
  facilities,
  isLoading,
  headerContent,
  isFavorite,
  onToggleFavorite,
  emptyState,
}: MapListViewProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // When marker clicked on map → scroll to item in list
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

  // When map icon clicked in list → zoom map to that facility
  const handleShowOnMap = useCallback((facility: FacilityWithMeta) => {
    setFocusedId(facility.id);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] overflow-hidden">
      {/* Map section - always visible, 30% height */}
      <div className="h-[30%] min-h-[160px] shrink-0 relative">
        {!isLoading && facilities.length > 0 ? (
          <MapView
            facilities={facilities}
            focusedId={focusedId}
            onMarkerClick={handleMarkerClick}
            className="h-full w-full"
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            {isLoading ? (
              <Icon icon={ICONS.spinner} width={20} height={20} className="animate-spin text-muted-foreground" />
            ) : (
              <span className="text-xs text-muted-foreground">Žádná místa k zobrazení</span>
            )}
          </div>
        )}
      </div>

      {/* List section - scrollable */}
      <div className="flex-1 overflow-y-auto overscroll-contain border-t border-border/30">
        {headerContent}

        <div className="flex flex-col gap-2.5 px-4 pb-4">
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
