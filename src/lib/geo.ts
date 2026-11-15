import type { LngLat } from "./types";

export function distanceKm(a: LngLat, b: LngLat): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function circlePolygon(center: LngLat, radiusKm: number, steps = 96): [number, number][] {
  const coords: [number, number][] = [];
  const latR = radiusKm / 110.574;
  const lngR = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    coords.push([center.lng + lngR * Math.cos(t), center.lat + latR * Math.sin(t)]);
  }
  return coords;
}

export function formatDistance(km: number): { value: string; unit: string } {
  if (km < 1) return { value: String(Math.max(10, Math.round((km * 1000) / 10) * 10)), unit: "m" };
  return { value: km < 10 ? km.toFixed(1).replace(".", ",") : String(Math.round(km)), unit: "km" };
}

const isApple = () => /iPhone|iPad|Macintosh/.test(navigator.userAgent);

export function directionsUrl(p: LngLat, name: string): string {
  return isApple()
    ? `https://maps.apple.com/?daddr=${p.lat},${p.lng}&q=${encodeURIComponent(name)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
}
