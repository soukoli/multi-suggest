"use client";

import { useQuery } from "@tanstack/react-query";
import { FacilityWithMeta, FacilitiesResponse, Facility } from "@/lib/types";
import { useLocationStore } from "@/store/useLocationStore";
import { useFilterStore } from "@/store/useFilterStore";
import { haversineDistance } from "@/lib/geo";
import { getCrowdLevel, getCrowdLabel, getGoodTimes } from "@/lib/crowd-rules";

/**
 * Worker API URL - for production use the deployed worker URL.
 * Falls back to static data for local development if the worker is unavailable.
 */
const WORKER_API_URL = process.env.NEXT_PUBLIC_WORKER_URL || "https://multisuggest-scraper.workers.dev";

/**
 * Fetch facilities from the Cloudflare Worker API.
 * Falls back to static JSON data if worker is unavailable.
 */
async function fetchFromWorker(
  lat: number,
  lng: number,
  category: string | null,
  freeOnly: boolean,
  kidsOnly: boolean
): Promise<FacilitiesResponse> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radius: "10",
    limit: "100",
  });

  if (category) params.set("category", category);
  if (freeOnly) params.set("free_only", "1");
  if (kidsOnly) params.set("kids", "1");

  const res = await fetch(`${WORKER_API_URL}/api/facilities?${params}`, {
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`Worker API returned ${res.status}`);
  }

  return res.json();
}

/**
 * Fallback: use static bundled data when worker is unreachable.
 * This loads the legacy facilities.json format.
 */
async function fetchFromStatic(
  lat: number,
  lng: number,
  category: string | null,
  freeOnly: boolean,
  kidsOnly: boolean
): Promise<FacilitiesResponse> {
  // Dynamic import to avoid bundling in production when worker is available
  const mod = await import("@/data/facilities.json");
  const raw = mod.default as any;

  // Handle both old format (array) and new format (object with facilities key)
  let facilities: Facility[] = Array.isArray(raw) ? raw : (raw.facilities || []);
  const scrapedAt = Array.isArray(raw) ? null : raw.scraped_at;

  // Apply filters
  if (category) {
    facilities = facilities.filter((f) => f.category === category);
  }
  if (freeOnly) {
    facilities = facilities.filter((f) => !f.additional_payment);
  }
  if (kidsOnly) {
    facilities = facilities.filter((f) => f.kids_activities);
  }

  // Enrich with distance and crowd data
  const enriched: FacilityWithMeta[] = facilities.map((f) => {
    const distance = haversineDistance(lat, lng, f.lat, f.lng);
    const crowdLevel = getCrowdLevel(f.category);
    const crowdLabel = getCrowdLabel(crowdLevel);
    const goodTimes = getGoodTimes(f.category);

    return {
      ...f,
      // Ensure new fields have defaults for old data format
      activity_summary: f.activity_summary || null,
      gallery_images: f.gallery_images || [],
      email: f.email || null,
      additional_payment: f.additional_payment || false,
      additional_payment_desc: f.additional_payment_desc || null,
      active_cards: f.active_cards || [],
      kids_activities: f.kids_activities || false,
      only_virtual_card: f.only_virtual_card || false,
      parking: f.parking || "Unknown",
      self_service: f.self_service || false,
      self_service_times: f.self_service_times || null,
      unlimited_oh: f.unlimited_oh || false,
      facebook_url: f.facebook_url || null,
      instagram_url: f.instagram_url || null,
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

  return {
    facilities: results,
    meta: {
      total: results.length,
      last_sync: scrapedAt,
      radius_km: 10,
    },
  };
}

/**
 * Client-side facility data hook.
 * Tries Worker API first, falls back to static JSON data.
 */
export function useFacilities() {
  const { lat, lng } = useLocationStore();
  const { activeCategory, freeOnly, kidsOnly, parkingOnly, searchQuery } = useFilterStore();

  return useQuery({
    queryKey: ["facilities", lat, lng, activeCategory, freeOnly, kidsOnly, parkingOnly, searchQuery],
    queryFn: async (): Promise<FacilitiesResponse> => {
      let response: FacilitiesResponse;

      try {
        response = await fetchFromWorker(lat, lng, activeCategory, freeOnly, kidsOnly);

        // Enrich with crowd data (worker doesn't compute this)
        response.facilities = response.facilities.map((f) => ({
          ...f,
          crowdLevel: f.crowdLevel || getCrowdLevel(f.category),
          crowdLabel: f.crowdLabel || getCrowdLabel(getCrowdLevel(f.category)),
          goodTimes: f.goodTimes || getGoodTimes(f.category),
        }));
      } catch (err) {
        console.warn("[useFacilities] Worker API unavailable, using static data:", err);
        response = await fetchFromStatic(lat, lng, activeCategory, freeOnly, kidsOnly);
      }

      // Client-side filters (not sent to Worker API)
      let facilities = response.facilities;

      // Parking filter
      if (parkingOnly) {
        facilities = facilities.filter((f) => f.parking === "Yes");
      }

      // Search filter (client-side fulltext)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        facilities = facilities.filter((f) =>
          f.name.toLowerCase().includes(q) ||
          f.address.toLowerCase().includes(q) ||
          (f.activity_summary || "").toLowerCase().includes(q) ||
          f.activities.some((a) => a.toLowerCase().includes(q))
        );
      }

      return {
        facilities,
        meta: {
          ...response.meta,
          total: facilities.length,
        },
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRandomFacility() {
  const { lat, lng } = useLocationStore();
  const { activeCategory, freeOnly, kidsOnly } = useFilterStore();

  return useQuery({
    queryKey: ["random-facility", lat, lng, activeCategory, freeOnly, kidsOnly, Date.now()],
    queryFn: async (): Promise<{ facility: FacilityWithMeta | null }> => {
      let response: FacilitiesResponse;

      try {
        response = await fetchFromWorker(lat, lng, activeCategory, freeOnly, kidsOnly);
        response.facilities = response.facilities.map((f) => ({
          ...f,
          crowdLevel: f.crowdLevel || getCrowdLevel(f.category),
          crowdLabel: f.crowdLabel || getCrowdLabel(getCrowdLevel(f.category)),
          goodTimes: f.goodTimes || getGoodTimes(f.category),
        }));
      } catch {
        response = await fetchFromStatic(lat, lng, activeCategory, freeOnly, kidsOnly);
      }

      const { facilities } = response;

      // Pick from good-time places
      const goodTimePlaces = facilities.filter(
        (f) => f.crowdLevel === "empty" || f.crowdLevel === "ok"
      );

      const pool = goodTimePlaces.length > 0 ? goodTimePlaces : facilities;
      const randomIndex = Math.floor(Math.random() * pool.length);

      return { facility: pool[randomIndex] || null };
    },
    staleTime: 0,
    enabled: false,
  });
}
