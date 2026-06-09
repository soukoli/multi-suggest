"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProfileState {
  fullName: string;
  email: string;
  phone: string;
  cardNumber: string;
  setProfile: (data: Partial<Omit<ProfileState, "setProfile" | "isComplete">>) => void;
  isComplete: () => boolean;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      fullName: "",
      email: "",
      phone: "",
      cardNumber: "",

      setProfile: (data) => set(data),

      isComplete: () => {
        const s = get();
        return !!(s.fullName && s.email && s.phone && s.cardNumber);
      },
    }),
    {
      name: "multisuggest-profile",
    }
  )
);
