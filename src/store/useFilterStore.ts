"use client";

import { create } from "zustand";
import { Category } from "@/lib/types";

interface FilterState {
  activeCategory: Category | null;
  setCategory: (category: Category | null) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  activeCategory: null,

  setCategory: (category: Category | null) => {
    set({ activeCategory: category });
  },
}));
