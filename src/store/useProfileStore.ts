"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const WORKER_API_URL = process.env.NEXT_PUBLIC_WORKER_URL || "https://multisuggest-scraper.soukoli.workers.dev";
const PROFILE_TOKEN = process.env.NEXT_PUBLIC_PROFILE_TOKEN || "127b48233f9606eb189bb7e4706e95bf";

interface ProfileState {
  fullName: string;
  email: string;
  phone: string;
  cardNumber: string;
  syncing: boolean;
  lastSynced: string | null;
  setProfile: (data: Partial<Pick<ProfileState, "fullName" | "email" | "phone" | "cardNumber">>) => void;
  isComplete: () => boolean;
  syncFromBackend: () => Promise<void>;
  syncToBackend: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      fullName: "",
      email: "",
      phone: "",
      cardNumber: "",
      syncing: false,
      lastSynced: null,

      setProfile: (data) => {
        set(data);
        // Auto-sync to backend after local update
        setTimeout(() => get().syncToBackend(), 500);
      },

      isComplete: () => {
        const s = get();
        return !!(s.fullName && s.email && s.phone && s.cardNumber);
      },

      syncFromBackend: async () => {
        try {
          set({ syncing: true });
          const res = await fetch(`${WORKER_API_URL}/api/profile`, {
            headers: { "X-Profile-Token": PROFILE_TOKEN },
            signal: AbortSignal.timeout(5000),
          });
          if (!res.ok) return;
          const data = await res.json();
          // Only update if backend has non-empty data
          if (data.fullName || data.email || data.phone || data.cardNumber) {
            set({
              fullName: data.fullName || get().fullName,
              email: data.email || get().email,
              phone: data.phone || get().phone,
              cardNumber: data.cardNumber || get().cardNumber,
              lastSynced: new Date().toISOString(),
            });
          }
        } catch {
          // Silent fail - localStorage is still available as fallback
        } finally {
          set({ syncing: false });
        }
      },

      syncToBackend: async () => {
        const s = get();
        if (!s.fullName && !s.email && !s.phone && !s.cardNumber) return;
        try {
          await fetch(`${WORKER_API_URL}/api/profile`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Profile-Token": PROFILE_TOKEN,
            },
            body: JSON.stringify({
              fullName: s.fullName,
              email: s.email,
              phone: s.phone,
              cardNumber: s.cardNumber,
            }),
            signal: AbortSignal.timeout(5000),
          });
          set({ lastSynced: new Date().toISOString() });
        } catch {
          // Silent fail - data is still in localStorage
        }
      },
    }),
    {
      name: "multisuggest-profile",
    }
  )
);
