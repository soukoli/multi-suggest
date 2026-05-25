"use client";

import { useEffect, useRef } from "react";
import { FacilityWithMeta, Category } from "@/lib/types";
import { useLocationStore } from "@/store/useLocationStore";

interface MapViewProps {
  facilities: FacilityWithMeta[];
  focusedId?: string | null;
  onMarkerClick?: (facilityId: string) => void;
  className?: string;
}

/** Category emoji icons for map markers */
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

/**
 * Leaflet map with category emoji markers.
 * Supports: dark/light tiles, marker click callbacks, focus on specific facility.
 */
export function MapView({ facilities, focusedId, onMarkerClick, className }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Layer[]>([]);
  const { lat, lng } = useLocationStore();

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    import("leaflet").then((L) => {
      if (destroyed || !containerRef.current) return;

      // Inject leaflet CSS once
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Create or update map
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
          html: `<div style="font-size:${isFocused ? "28px" : "20px"};line-height:1;text-align:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));transition:transform 0.2s;${isFocused ? "transform:scale(1.3);" : ""}">${emoji}</div>`,
          className: "leaflet-emoji-marker",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([facility.lat, facility.lng], { icon }).addTo(map);

        // Popup
        marker.bindPopup(
          `<div style="font-family:system-ui;font-size:12px;line-height:1.4;min-width:100px;cursor:pointer;" data-facility-id="${facility.id}">
            <strong>${facility.name}</strong>
            ${!facility.additional_payment ? '<br/><span style="color:#16a34a;font-size:11px;">Zdarma</span>' : ""}
            <br/><span style="color:#666;font-size:10px;">Klikni pro detail</span>
          </div>`,
          { closeButton: false, offset: [0, -8] }
        );

        // On popup open + click → trigger callback
        marker.on("click", () => {
          if (onMarkerClick) {
            // Small delay so popup shows first
            setTimeout(() => onMarkerClick(facility.id), 300);
          }
        });

        markersRef.current.push(marker);
      }

      // User position
      const userMarker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: "#3b82f6",
        color: "#fff",
        weight: 3,
        fillOpacity: 1,
      }).addTo(map);
      markersRef.current.push(userMarker);

      // Handle focus: zoom to focused facility
      if (focusedId) {
        const focused = facilities.find(f => f.id === focusedId);
        if (focused) {
          map.setView([focused.lat, focused.lng], 15, { animate: true });
        }
      } else if (facilities.length > 0) {
        // Fit all markers in view
        const bounds = L.latLngBounds(
          facilities.map((f) => [f.lat, f.lng] as [number, number])
        );
        bounds.extend([lat, lng]);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }

      setTimeout(() => map.invalidateSize(), 150);
    });

    return () => {
      destroyed = true;
    };
  }, [lat, lng, facilities, isDark, focusedId, onMarkerClick]);

  // Full cleanup on unmount
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
