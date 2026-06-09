"use client";

import { useQuery } from "@tanstack/react-query";

const WORKER_API_URL = process.env.NEXT_PUBLIC_WORKER_URL || "https://multisuggest-scraper.soukoli.workers.dev";

export interface SportBoxSlot {
  date: string;
  hour: string;
  available: number;
}

export interface SportBoxData {
  objectId: number;
  name: string;
  address: string;
  slots: SportBoxSlot[];
  fetched_at: string;
}

export function useSportBoxSlots() {
  return useQuery({
    queryKey: ["sportbox-slots"],
    queryFn: async (): Promise<SportBoxData> => {
      const res = await fetch(`${WORKER_API_URL}/api/sportbox/slots`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        throw new Error(`SportBox API returned ${res.status}`);
      }

      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    refetchOnWindowFocus: true,
  });
}

/**
 * Build a pre-filled booking URL for a specific slot.
 */
export function buildBookingUrl(slot: SportBoxSlot): string {
  const params = new URLSearchParams({
    selectedDate: slot.date,
    objectId: "3",
    displayName: "SportBox Chodov, Roztylská 2321/19, Praha 4",
    startHour: slot.hour,
    freeSlots: slot.available.toString(),
    lang: "cs",
  });
  return `https://sport-box.cz/Booking/BookingForm?${params}`;
}
