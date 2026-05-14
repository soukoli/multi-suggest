"use client";

import { useEffect, useRef } from "react";
import { FacilityWithMeta } from "@/lib/types";
import { useLocationStore } from "@/store/useLocationStore";

interface MapViewProps {
  facilities: FacilityWithMeta[];
  className?: string;
}

/**
 * Leaflet map showing facility markers.
 * Dynamically imported (no SSR) to avoid window is not defined.
 */
export function MapView({ facilities, className }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const { lat, lng } = useLocationStore();

  useEffect(() => {
    if (!mapRef.current) return;

    // Dynamically import leaflet (SSR-safe)
    import("leaflet").then((L) => {
      // Import CSS
      import("leaflet/dist/leaflet.css");

      if (mapInstanceRef.current) {
        // Update existing map
        mapInstanceRef.current.setView([lat, lng], 13);
      } else {
        // Create map
        const map = L.map(mapRef.current!, {
          zoomControl: false,
          attributionControl: false,
        }).setView([lat, lng], 13);

        // Monochrome tile layer (Stamen Toner Lite or CartoDB Positron)
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current!;

      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // Add facility markers
      for (const facility of facilities) {
        const marker = L.circleMarker([facility.lat, facility.lng], {
          radius: 6,
          fillColor: facility.additional_payment ? "#f59e0b" : "#000",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        }).addTo(map);

        marker.bindPopup(
          `<div style="font-family: system-ui; font-size: 12px; line-height: 1.3;">
            <strong>${facility.name}</strong><br/>
            <span style="color: #666;">${facility.address || ""}</span>
          </div>`,
          { closeButton: false, offset: [0, -4] }
        );

        markersRef.current.push(marker);
      }

      // Add user position marker
      L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: "#3b82f6",
        color: "#fff",
        weight: 3,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map);

      // Invalidate size after render
      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, facilities]);

  return (
    <div
      ref={mapRef}
      className={className}
      style={{ minHeight: "200px" }}
    />
  );
}
