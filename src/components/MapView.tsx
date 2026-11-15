import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MLMap } from "maplibre-gl";
import type { Facility, LngLat } from "../lib/types";
import { CATEGORIES } from "../lib/categories";
import { circlePolygon } from "../lib/geo";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

maplibregl.setWorkerUrl(workerUrl);

const STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

interface Props {
  facilities: Facility[];
  favoriteIds: Set<string>;
  selectedId: string | null;
  hoverId: string | null;
  center: LngLat;
  radiusKm: number;
  showRadius: boolean;
  me: LngLat | null;
  dark: boolean;
  padding: { top: number; bottom: number; left: number };
  onSelect: (id: string | null) => void;
  onViewChange: (center: LngLat) => void;
  /** increments to request "fit the radius into view" */
  fitKey: number;
}

const colorMatch = [
  "match",
  ["get", "c"],
  ...CATEGORIES.flatMap((c) => [c.id, c.color]),
  "#8A9BA8",
] as unknown as maplibregl.ExpressionSpecification;

function toGeoJSON(list: Facility[], favs: Set<string>, selected: string | null, hover: string | null) {
  return {
    type: "FeatureCollection" as const,
    features: list.map((f) => ({
      type: "Feature" as const,
      id: Number(f.id),
      geometry: { type: "Point" as const, coordinates: [f.lng, f.lat] },
      properties: { id: f.id, name: f.name, c: f.category, fav: favs.has(f.id) ? 1 : 0, sel: f.id === selected || f.id === hover ? 1 : 0 },
    })),
  };
}

function ringGeoJSON(center: LngLat, km: number) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [circlePolygon(center, km)] },
  };
}

export function MapView(p: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const ringLabel = useRef<maplibregl.Marker | null>(null);
  const meMarker = useRef<maplibregl.Marker | null>(null);
  const latest = useRef(p);
  latest.current = p;

  // ---- init once
  useEffect(() => {
    const m = new maplibregl.Map({
      container: el.current!,
      style: p.dark ? STYLES.dark : STYLES.light,
      center: [p.center.lng, p.center.lat],
      zoom: 12.5,
      attributionControl: { compact: true },
      pitchWithRotate: false,
      dragRotate: false,
    });
    m.touchZoomRotate.disableRotation();
    map.current = m;

    m.on("style.load", () => installLayers(m));
    m.on("click", "fac", (e) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (id) latest.current.onSelect(id);
    });
    m.on("click", (e) => {
      const hit = m.queryRenderedFeatures(e.point, { layers: ["fac"] });
      if (!hit.length) latest.current.onSelect(null);
    });
    m.on("mouseenter", "fac", () => (m.getCanvas().style.cursor = "pointer"));
    m.on("mouseleave", "fac", () => (m.getCanvas().style.cursor = ""));
    // only user gestures count as "I moved the map" (not programmatic fits/eases)
    m.on("moveend", (e) => {
      if (!(e as { originalEvent?: unknown }).originalEvent) return;
      const c = m.getCenter();
      latest.current.onViewChange({ lat: c.lat, lng: c.lng });
    });

    const labelEl = document.createElement("div");
    labelEl.className =
      "pointer-events-none rounded-full bg-accent px-2.5 pt-[3px] pb-[1px] font-display text-[15px] font-bold leading-none tracking-wide text-accent-ink shadow-float";
    ringLabel.current = new maplibregl.Marker({ element: labelEl, anchor: "center" });

    const meEl = document.createElement("div");
    meEl.innerHTML =
      '<span style="position:absolute;inset:-10px;border-radius:999px;background:rgba(31,166,224,.18)"></span><span style="position:relative;display:block;width:16px;height:16px;border-radius:999px;background:#1FA6E0;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.35)"></span>';
    meEl.style.cssText = "position:relative;width:16px;height:16px";
    meMarker.current = new maplibregl.Marker({ element: meEl });

    return () => m.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function installLayers(m: MLMap) {
    const s = latest.current;
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#22c7be";
    const fav = getComputedStyle(document.documentElement).getPropertyValue("--fav").trim() || "#ffc23d";
    const halo = s.dark ? "#0e1b24" : "#ffffff";

    m.addSource("ring", { type: "geojson", data: ringGeoJSON(s.center, s.radiusKm) });
    m.addLayer({ id: "ring-fill", type: "fill", source: "ring", paint: { "fill-color": accent, "fill-opacity": 0.07 } });
    m.addLayer({
      id: "ring-line",
      type: "line",
      source: "ring",
      paint: { "line-color": accent, "line-width": 2.5, "line-dasharray": [3, 2] },
    });

    m.addSource("fac", { type: "geojson", data: toGeoJSON(s.facilities, s.favoriteIds, s.selectedId, s.hoverId) });
    m.addLayer({
      id: "fac-fav",
      type: "circle",
      source: "fac",
      filter: ["==", ["get", "fav"], 1],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 6, 15, 13],
        "circle-color": "rgba(0,0,0,0)",
        "circle-stroke-color": fav,
        "circle-stroke-width": 3,
      },
    });
    m.addLayer({
      id: "fac",
      type: "circle",
      source: "fac",
      paint: {
        "circle-radius": [
          "interpolate", ["linear"], ["zoom"],
          9, ["case", ["==", ["get", "sel"], 1], 9, 3.5],
          13, ["case", ["==", ["get", "sel"], 1], 11, 6],
          16, ["case", ["==", ["get", "sel"], 1], 13, 9],
        ],
        "circle-color": colorMatch,
        "circle-stroke-color": halo,
        "circle-stroke-width": ["case", ["==", ["get", "sel"], 1], 3.5, 1.5],
      },
    });
    m.addLayer({
      id: "fac-label",
      type: "symbol",
      source: "fac",
      minzoom: 14.5,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 12,
        "text-offset": [0, 1.1],
        "text-anchor": "top",
        "text-max-width": 9,
        "text-optional": true,
      },
      paint: { "text-color": s.dark ? "#eaf2f1" : "#10212b", "text-halo-color": halo, "text-halo-width": 1.6 },
    });
    syncRing();
    syncFacilities();
  }

  function syncFacilities() {
    const m = map.current;
    const src = m?.getSource("fac") as GeoJSONSource | undefined;
    const s = latest.current;
    src?.setData(toGeoJSON(s.facilities, s.favoriteIds, s.selectedId, s.hoverId));
  }

  function syncRing() {
    const m = map.current;
    const s = latest.current;
    if (!m) return;
    const src = m.getSource("ring") as GeoJSONSource | undefined;
    src?.setData(ringGeoJSON(s.center, s.radiusKm));
    const vis = s.showRadius ? "visible" : "none";
    if (m.getLayer("ring-line")) {
      m.setLayoutProperty("ring-line", "visibility", vis);
      m.setLayoutProperty("ring-fill", "visibility", vis);
    }
    const label = ringLabel.current!;
    if (s.showRadius) {
      label.getElement().textContent = `${String(s.radiusKm).replace(".", ",")} KM`;
      label.setLngLat([s.center.lng, s.center.lat + s.radiusKm / 110.574]).addTo(m);
    } else label.remove();
  }

  // ---- reactive updates
  useEffect(syncFacilities, [p.facilities, p.favoriteIds, p.selectedId, p.hoverId]);
  useEffect(syncRing, [p.center, p.radiusKm, p.showRadius]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (p.me) meMarker.current!.setLngLat([p.me.lng, p.me.lat]).addTo(m);
    else meMarker.current!.remove();
  }, [p.me]);

  useEffect(() => {
    map.current?.setStyle(p.dark ? STYLES.dark : STYLES.light);
  }, [p.dark]);

  useEffect(() => {
    map.current?.easeTo({ padding: p.padding, duration: 250 });
  }, [p.padding.bottom, p.padding.left, p.padding.top]); // eslint-disable-line react-hooks/exhaustive-deps

  // fly to the selected place
  useEffect(() => {
    const f = p.facilities.find((x) => x.id === p.selectedId);
    if (f && map.current) {
      map.current.easeTo({
        center: [f.lng, f.lat],
        zoom: Math.max(map.current.getZoom(), 14.5),
        padding: p.padding,
        duration: 600,
      });
    }
  }, [p.selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // fit radius
  useEffect(() => {
    if (!p.fitKey || !map.current) return;
    const b = new maplibregl.LngLatBounds();
    if (p.showRadius) circlePolygon(p.center, p.radiusKm, 16).forEach((c) => b.extend(c));
    else if (p.facilities.length) p.facilities.forEach((f) => b.extend([f.lng, f.lat]));
    else return;
    if (!p.showRadius && p.facilities.length === 1) {
      map.current.easeTo({ center: [p.facilities[0].lng, p.facilities[0].lat], zoom: 14.5, padding: p.padding, duration: 700 });
      return;
    }
    map.current.fitBounds(b, { padding: { ...p.padding, top: p.padding.top + 24, right: 24, bottom: p.padding.bottom + 24, left: p.padding.left + 24 }, duration: 700 });
  }, [p.fitKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // maplibre's CSS forces position:relative on the container, so size it via a wrapper
  return (
    <div className="absolute inset-0">
      <div ref={el} style={{ width: "100%", height: "100%" }} aria-label="Mapa sportovišť" />
    </div>
  );
}
