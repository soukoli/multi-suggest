"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  /** Header content rendered above the list (filters, search, etc.) */
  headerContent?: React.ReactNode;
  /** Whether each item shows a "remove" heart (favorites) or toggle heart */
  isFavoritePage?: boolean;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  emptyState?: React.ReactNode;
}

/**
 * Shared map+list view for Nearby and Favorites pages.
 * 
 * Mobile: toggle between full-screen map and full-screen list via floating button.
 * Tablet+: split layout (map top, list bottom).
 * 
 * Interactions:
 * - Click marker on map → show popup, switch to list & scroll to item
 * - Click facility in list → switch to map, center on facility
 */
export function MapListView({
  facilities,
  isLoading,
  headerContent,
  isFavorite,
  onToggleFavorite,
  emptyState,
}: MapListViewProps) {
  const [showMap, setShowMap] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // When marker clicked on map → switch to list, scroll to item
  const handleMarkerClick = useCallback((facilityId: string) => {
    setFocusedId(facilityId);
    setShowMap(false);
    // Scroll to the item after switching to list
    setTimeout(() => {
      const el = document.getElementById(`facility-${facilityId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-foreground/30");
        setTimeout(() => el.classList.remove("ring-2", "ring-foreground/30"), 2000);
      }
    }, 350);
  }, []);

  // When list item clicked → switch to map, center on facility
  const handleItemClick = useCallback((facility: FacilityWithMeta) => {
    setFocusedId(facility.id);
    setShowMap(true);
  }, []);

  return (
    <div className="relative flex flex-col h-[calc(100dvh-5rem)] overflow-hidden">
      {/* === MOBILE: Toggle between map and list === */}
      <div className="sm:hidden flex-1 relative">
        <AnimatePresence mode="wait" initial={false}>
          {showMap ? (
            <motion.div
              key="map"
              className="absolute inset-0"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
            >
              <MapView
                facilities={facilities}
                focusedId={focusedId}
                onMarkerClick={handleMarkerClick}
                className="h-full w-full"
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="absolute inset-0 overflow-y-auto overscroll-contain"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
              ref={listRef}
            >
              {headerContent}

              <div className="flex flex-col gap-2.5 px-4 pb-4">
                {isLoading && (
                  <div className="flex justify-center py-10">
                    <Icon icon={ICONS.spinner} width={20} height={20} className="animate-spin text-muted-foreground" />
                  </div>
                )}

                {!isLoading && facilities.length === 0 && emptyState}

                {facilities.map((facility) => (
                  <div
                    key={facility.id}
                    id={`facility-${facility.id}`}
                    onClick={() => handleItemClick(facility)}
                    className="cursor-pointer transition-all rounded-2xl"
                  >
                    <FacilityListItem
                      facility={facility}
                      isFavorite={isFavorite(facility.id)}
                      onToggleFavorite={() => onToggleFavorite(facility.id)}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating toggle button */}
        <button
          onClick={() => setShowMap(!showMap)}
          className="absolute bottom-4 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg shadow-black/20 transition-transform active:scale-90"
        >
          {showMap ? (
            <span className="text-sm font-bold">☰</span>
          ) : (
            <Icon icon={ICONS.nearby} width={20} height={20} />
          )}
        </button>
      </div>

      {/* === TABLET+: Split layout (map top, list bottom) === */}
      <div className="hidden sm:flex sm:flex-col sm:flex-1">
        {/* Map section */}
        <div className="h-[35%] shrink-0 overflow-hidden">
          <MapView
            facilities={facilities}
            focusedId={focusedId}
            onMarkerClick={handleMarkerClick}
            className="h-full w-full"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center py-1.5 bg-background border-t border-border/50">
          <div className="h-1 w-8 rounded-full bg-muted-foreground/20" />
        </div>

        {/* List section */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {headerContent}

          <div className="flex flex-col gap-2.5 px-4 pb-4">
            {isLoading && (
              <div className="flex justify-center py-10">
                <Icon icon={ICONS.spinner} width={20} height={20} className="animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && facilities.length === 0 && emptyState}

            {facilities.map((facility) => (
              <div
                key={facility.id}
                id={`facility-${facility.id}`}
                onClick={() => handleItemClick(facility)}
                className="cursor-pointer transition-all rounded-2xl"
              >
                <FacilityListItem
                  facility={facility}
                  isFavorite={isFavorite(facility.id)}
                  onToggleFavorite={() => onToggleFavorite(facility.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
