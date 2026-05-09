"use client";

import { useQuery } from "@tanstack/react-query";
import { Category, FacilityWithMeta } from "@/lib/types";
import { useLocationStore } from "@/store/useLocationStore";
import { useFilterStore } from "@/store/useFilterStore";
import facilitiesData from "@/data/facilities.json";
import { Facility } from "@/lib/types";

const FACILITIES = facilitiesData as unknown as Facility[];
import { haversineDistance } from "@/lib/geo";
import { getCrowdLevel, getCrowdLabel, getGoodTimes } from "@/lib/crowd-rules";

/**
 * Client-side facility data hook.
 * In production, this will fetch from the Cloudflare Worker API.
 * For now, uses bundled mock data with client-side filtering.
 */
export function useFacilities() {
  const { lat, lng } = useLocationStore();
  const { activeCategory } = useFilterStore();

  return useQuery({
    queryKey: ["facilities", lat, lng, activeCategory],
    queryFn: async (): Promise<{ facilities: FacilityWithMeta[] }> => {
      // TODO: Replace with Worker API call in production:
      // const res = await fetch(`${WORKER_URL}/api/facilities?lat=${lat}&lng=${lng}&category=${activeCategory}`);
      // return res.json();

      let facilities = FACILITIES;

      // Filter by category
      if (activeCategory) {
        facilities = facilities.filter((f) => f.category === activeCategory);
      }

      // Enrich with distance and crowd data
      const enriched: FacilityWithMeta[] = facilities.map((f) => {
        const distance = haversineDistance(lat, lng, f.lat, f.lng);
        const crowdLevel = getCrowdLevel(f.category);
        const crowdLabel = getCrowdLabel(crowdLevel);
        const goodTimes = getGoodTimes(f.category);

        return {
          ...f,
          distance,
          crowdLevel,
          crowdLabel,
          goodTimes,
        };
      });

      // Sort by distance
      enriched.sort((a, b) => a.distance - b.distance);

      // Filter by radius (10km)
      const results = enriched.filter((f) => f.distance <= 10);

      return { facilities: results };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRandomFacility() {
  const { lat, lng } = useLocationStore();
  const { activeCategory } = useFilterStore();

  return useQuery({
    queryKey: ["random-facility", lat, lng, activeCategory, Date.now()],
    queryFn: async (): Promise<{ facility: FacilityWithMeta | null }> => {
      let facilities = FACILITIES;

      if (activeCategory) {
        facilities = facilities.filter((f) => f.category === activeCategory);
      }

      const enriched: FacilityWithMeta[] = facilities.map((f) => {
        const distance = haversineDistance(lat, lng, f.lat, f.lng);
        const crowdLevel = getCrowdLevel(f.category);
        const crowdLabel = getCrowdLabel(crowdLevel);
        const goodTimes = getGoodTimes(f.category);

        return { ...f, distance, crowdLevel, crowdLabel, goodTimes };
      });

      // Pick from good-time places
      const goodTimePlaces = enriched.filter(
        (f) => f.crowdLevel === "empty" || f.crowdLevel === "ok"
      );

      const pool = goodTimePlaces.length > 0 ? goodTimePlaces : enriched;
      const randomIndex = Math.floor(Math.random() * pool.length);

      return { facility: pool[randomIndex] || null };
    },
    staleTime: 0,
    enabled: false,
  });
}
