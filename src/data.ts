import { useEffect, useMemo, useState } from "react";
import type { Dataset, Facility, Located } from "./lib/types";
import { distanceKm } from "./lib/geo";
import { useStore } from "./store";

export function useDataset() {
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/data/facilities.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(String(e.message || e)));
  }, []);
  return { data, error };
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function useResults(all: Facility[] | undefined) {
  const { center, radiusKm, categories, query, noSurcharge, kidsOnly, nonstop, parking } = useStore();
  const index = useMemo(
    () => (all ?? []).map((f) => ({ f, text: fold(`${f.name} ${f.street} ${f.city ?? ""} ${f.activities.join(" ")}`) })),
    [all],
  );
  return useMemo(() => {
    const q = fold(query.trim());
    const out: Located[] = [];
    for (const { f, text } of index) {
      if (categories.length && !categories.includes(f.category) && !f.categories.some((c) => categories.includes(c))) continue;
      if (noSurcharge && f.surcharge) continue;
      if (kidsOnly && !f.kids && f.category !== "kids") continue;
      if (nonstop && !f.nonstop) continue;
      if (parking && f.parking !== true) continue;
      if (q && !text.includes(q)) continue;
      const distance = distanceKm(center, f);
      // A text search ignores the radius so you can find a known place anywhere.
      if (!q && distance > radiusKm) continue;
      out.push({ ...f, distance });
    }
    out.sort((a, b) => a.distance - b.distance);
    return out;
  }, [index, center, radiusKm, categories, query, noSurcharge, kidsOnly, nonstop, parking]);
}

export function withDistance(list: Facility[], center: { lat: number; lng: number }): Located[] {
  return list.map((f) => ({ ...f, distance: distanceKm(center, f) })).sort((a, b) => a.distance - b.distance);
}
