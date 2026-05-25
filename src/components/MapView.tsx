"use client";

import { useEffect, useRef, useCallback } from "react";
import { FacilityWithMeta, Category } from "@/lib/types";
import { useLocationStore } from "@/store/useLocationStore";
import { useThemeStore } from "@/store/useThemeStore";

interface MapViewProps {
  facilities: FacilityWithMeta[];
  focusedId?: string | null;
  onMarkerClick?: (facilityId: string) => void;
  className?: string;
}

const CATEGORY_EMOJI: Record<Category, string> = {
  fitness: "💪",
  swimming: "🏊",
  wellness: "🧖",
  yoga: "🧘",
  group: "🏃",
  sports: "🎾",
  climbing: "🧗",
  kids: "👶",
  outdoor: "🌿",
  other: "📍",
};

const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export function MapView({ facilities, focusedId, onMarkerClick, className }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Layer[]>([]);
  const { lat, lng } = useLocationStore();
  const theme = useThemeStore((s) => s.theme);

  // Derive isDark reactively from store
  const getIsDark = useCallback(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, [theme]);

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    import("leaflet").then((L) => {
      if (destroyed || !containerRef.current) return;

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const isDark = getIsDark();

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current!, {
          zoomControl: false,
          attributionControl: false,
        }).setView([lat, lng], 13);

        tileLayerRef.current = L.tileLayer(isDark ? DARK_TILES : LIGHT_TILES, {
          maxZoom: 19,
        }).addTo(mapRef.current);
      } else {
        if (tileLayerRef.current) {
          tileLayerRef.current.setUrl(isDark ? DARK_TILES : LIGHT_TILES);
        }
      }

      const map = mapRef.current;

      // Clear old markers
      for (const m of markersRef.current) {
        map.removeLayer(m);
      }
      markersRef.current = [];

      // Add facility markers
      for (const facility of facilities) {
        const emoji = CATEGORY_EMOJI[facility.category] || "📍";
        const isFocused = facility.id === focusedId;

        const icon = L.divIcon({
          html: `<div style="font-size:${isFocused ? "26px" : "18px"};line-height:1;text-align:center;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));transition:all 0.2s;">${emoji}</div>`,
          className: "leaflet-emoji-marker",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([facility.lat, facility.lng], { icon }).addTo(map);

        marker.bindPopup(
          `<div style="font-family:system-ui;font-size:12px;line-height:1.4;min-width:100px;">
            <strong>${facility.name}</strong>
            ${!facility.additional_payment ? '<br/><span style="color:#16a34a;font-size:11px;">Zdarma</span>' : ""}
          </div>`,
          { closeButton: false, offset: [0, -8] }
        );

        marker.on("click", () => {
          if (onMarkerClick) {
            setTimeout(() => onMarkerClick(facility.id), 300);
          }
        });

        markersRef.current.push(marker);
      }

      // User position
      const userMarker = L.circleMarker([lat, lng], {
        radius: 7,
        fillColor: "#3b82f6",
        color: "#fff",
        weight: 2.5,
        fillOpacity: 1,
      }).addTo(map);
      markersRef.current.push(userMarker);

      // Focus or fit bounds
      if (focusedId) {
        const focused = facilities.find(f => f.id === focusedId);
        if (focused) {
          map.setView([focused.lat, focused.lng], 15, { animate: true });
        }
      } else if (facilities.length > 0) {
        const bounds = L.latLngBounds(
          facilities.map((f) => [f.lat, f.lng] as [number, number])
        );
        bounds.extend([lat, lng]);
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }

      setTimeout(() => map.invalidateSize(), 150);
    });

    return () => { destroyed = true; };
  }, [lat, lng, facilities, focusedId, onMarkerClick, getIsDark]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ width: "100%", height: "100%" }} />
  );
}
