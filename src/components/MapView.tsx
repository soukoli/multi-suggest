"use client";

import { useEffect, useRef } from "react";
import { FacilityWithMeta, Category } from "@/lib/types";
import { useLocationStore } from "@/store/useLocationStore";

interface MapViewProps {
  facilities: FacilityWithMeta[];
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

/**
 * Leaflet map showing facility markers with category icons.
 * Dynamically imported (no SSR) to avoid window errors.
 */
export function MapView({ facilities, className }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Layer[]>([]);
  const { lat, lng } = useLocationStore();

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      // Inject leaflet CSS if not already present
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], 13);
      } else {
        const map = L.map(mapRef.current!, {
          zoomControl: false,
          attributionControl: false,
        }).setView([lat, lng], 13);

        // CartoDB Positron - clean monochrome tiles
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current!;

      // Clear old markers
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      // Add facility markers with category emoji
      for (const facility of facilities) {
        const emoji = CATEGORY_EMOJI[facility.category] || "📍";

        const icon = L.divIcon({
          html: `<div style="font-size:18px;line-height:1;text-align:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">${emoji}</div>`,
          className: "leaflet-emoji-marker",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([facility.lat, facility.lng], { icon }).addTo(map);

        marker.bindPopup(
          `<div style="font-family:system-ui;font-size:12px;line-height:1.4;min-width:120px;">
            <strong style="font-size:13px;">${facility.name}</strong>
            ${facility.address ? `<br/><span style="color:#666;">${facility.address}</span>` : ""}
            ${!facility.additional_payment ? '<br/><span style="color:#16a34a;font-size:11px;font-weight:600;">Zdarma</span>' : '<br/><span style="color:#d97706;font-size:11px;">+ příplatek</span>'}
          </div>`,
          { closeButton: false, offset: [0, -8] }
        );

        markersRef.current.push(marker);
      }

      // User position marker
      const userMarker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: "#3b82f6",
        color: "#fff",
        weight: 3,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map);
      markersRef.current.push(userMarker);

      // Fit bounds if we have facilities
      if (facilities.length > 0) {
        const bounds = L.latLngBounds(
          facilities.map((f) => [f.lat, f.lng] as [number, number])
        );
        bounds.extend([lat, lng]);
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }

      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      cancelled = true;
    };
  }, [lat, lng, facilities]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={mapRef} className={className} style={{ width: "100%", height: "100%" }} />
  );
}
