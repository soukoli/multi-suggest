"use client";

import { create } from "zustand";
import { PRAGUE_CENTER } from "@/lib/geo";

interface LocationState {
  lat: number;
  lng: number;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  lat: PRAGUE_CENTER.lat,
  lng: PRAGUE_CENTER.lng,
  isLoading: false,
  error: null,
  hasPermission: false,

  requestLocation: () => {
    if (!navigator.geolocation) {
      set({ error: "Geolocation not supported", isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        set({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isLoading: false,
          hasPermission: true,
          error: null,
        });
      },
      (error) => {
        set({
          isLoading: false,
          error: error.message,
          hasPermission: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 min cache
      }
    );
  },
}));
