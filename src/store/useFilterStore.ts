"use client";

import { create } from "zustand";
import { Category } from "@/lib/types";

interface FilterState {
  activeCategory: Category | null;
  freeOnly: boolean;
  kidsOnly: boolean;
  parkingOnly: boolean;
  searchQuery: string;
  filtersOpen: boolean;
  radius: number; // km
  setCategory: (category: Category | null) => void;
  setFreeOnly: (value: boolean) => void;
  setKidsOnly: (value: boolean) => void;
  setParkingOnly: (value: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFiltersOpen: (open: boolean) => void;
  setRadius: (km: number) => void;
  clearFilters: () => void;
  activeFilterCount: () => number;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  activeCategory: null,
  freeOnly: false,
  kidsOnly: false,
  parkingOnly: false,
  searchQuery: "",
  filtersOpen: false,
  radius: 10,

  setCategory: (category: Category | null) => {
    set({ activeCategory: category });
  },

  setFreeOnly: (value: boolean) => {
    set({ freeOnly: value });
  },

  setKidsOnly: (value: boolean) => {
    set({ kidsOnly: value });
  },

  setParkingOnly: (value: boolean) => {
    set({ parkingOnly: value });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setFiltersOpen: (open: boolean) => {
    set({ filtersOpen: open });
  },

  setRadius: (km: number) => {
    set({ radius: km });
  },

  clearFilters: () => {
    set({
      activeCategory: null,
      freeOnly: false,
      kidsOnly: false,
      parkingOnly: false,
    });
  },

  activeFilterCount: () => {
    const state = get();
    let count = 0;
    if (state.activeCategory) count++;
    if (state.freeOnly) count++;
    if (state.kidsOnly) count++;
    if (state.parkingOnly) count++;
    return count;
  },
}));
