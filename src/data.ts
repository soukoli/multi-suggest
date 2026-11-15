import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
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
  const { center, radiusKm, categories, query: liveQuery, noSurcharge, kidsOnly, nonstop, parking } = useStore(
    useShallow((s) => ({
      center: s.center, radiusKm: s.radiusKm, categories: s.categories, query: s.query,
      noSurcharge: s.noSurcharge, kidsOnly: s.kidsOnly, nonstop: s.nonstop, parking: s.parking,
    })),
  );
  // Typing stays responsive; the filter runs at lower priority.
  const query = useDeferredValue(liveQuery);
  const index = useMemo(
    () =>
      (all ?? []).map((f) => ({
        f,
        name: fold(f.name),
        text: fold(`${f.name} ${f.street} ${f.city ?? ""} ${f.activities.join(" ")}`),
      })),
    [all],
  );
  return useMemo(() => {
    // Every word must match somewhere ("brno bazén" finds pools in Brno), in any order.
    const words = fold(query.trim()).split(/\s+/).filter(Boolean);
    const q = words.length > 0;
    const out: (Located & { rank: number })[] = [];
    for (const { f, name, text } of index) {
      if (categories.length && !categories.includes(f.category) && !f.categories.some((c) => categories.includes(c))) continue;
      if (noSurcharge && f.surcharge) continue;
      if (kidsOnly && !f.kids && f.category !== "kids") continue;
      if (nonstop && !f.nonstop) continue;
      if (parking && f.parking !== true) continue;
      if (q && !words.every((w) => text.includes(w))) continue;
      const distance = distanceKm(center, f);
      // A text search ignores the radius so you can find a known place anywhere.
      if (!q && distance > radiusKm) continue;
      // Relevance: name starts with the query > all words in the name > other matches.
      const rank = !q ? 0 : name.startsWith(words.join(" ")) ? 0 : words.every((w) => name.includes(w)) ? 1 : 2;
      out.push({ ...f, distance, rank });
    }
    out.sort((a, b) => a.rank - b.rank || a.distance - b.distance);
    return out as Located[];
  }, [index, center, radiusKm, categories, query, noSurcharge, kidsOnly, nonstop, parking]);
}

export function withDistance(list: Facility[], center: { lat: number; lng: number }): Located[] {
  return list.map((f) => ({ ...f, distance: distanceKm(center, f) })).sort((a, b) => a.distance - b.distance);
}
