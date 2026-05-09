"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  favorites: string[]; // facility IDs
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (id: string) => {
        set((state) => ({
          favorites: [...new Set([...state.favorites, id])],
        }));
      },

      removeFavorite: (id: string) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f !== id),
        }));
      },

      isFavorite: (id: string) => {
        return get().favorites.includes(id);
      },

      toggleFavorite: (id: string) => {
        const { favorites } = get();
        if (favorites.includes(id)) {
          set({ favorites: favorites.filter((f) => f !== id) });
        } else {
          set({ favorites: [...favorites, id] });
        }
      },
    }),
    {
      name: "multisuggest-favorites",
    }
  )
);
