import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, LngLat } from "./lib/types";
import type { CrowdReport } from "./lib/crowd";

export const PRAGUE: LngLat = { lat: 50.0815, lng: 14.428 };

export interface FavoriteEntry {
  addedAt: number;
  visits: number[]; // timestamps
  note: string;
}

type Theme = "system" | "light" | "dark";

interface State {
  // search
  center: LngLat;
  centerSource: "gps" | "map" | "default";
  radiusKm: number;
  categories: Category[];
  query: string;
  noSurcharge: boolean;
  kidsOnly: boolean;
  nonstop: boolean;
  parking: boolean;
  // ui
  selectedId: string | null;
  tab: "explore" | "favorites";
  theme: Theme;
  // personal
  favorites: Record<string, FavoriteEntry>;
  reports: Record<string, CrowdReport[]>;
  introSeen: boolean;
  hoverId: string | null;

  setCenter: (c: LngLat, source: State["centerSource"]) => void;
  setRadius: (km: number) => void;
  toggleCategory: (c: Category) => void;
  clearCategories: () => void;
  setQuery: (q: string) => void;
  toggleFlag: (k: "noSurcharge" | "kidsOnly" | "nonstop" | "parking") => void;
  select: (id: string | null) => void;
  setTab: (t: State["tab"]) => void;
  setTheme: (t: Theme) => void;
  toggleFavorite: (id: string) => void;
  logVisit: (id: string) => void;
  undoVisit: (id: string) => void;
  setNote: (id: string, note: string) => void;
  report: (id: string, level: CrowdReport["level"]) => void;
  dismissIntro: () => void;
  hover: (id: string | null) => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      center: PRAGUE,
      centerSource: "default",
      radiusKm: 3,
      categories: [],
      query: "",
      noSurcharge: false,
      kidsOnly: false,
      nonstop: false,
      parking: false,
      selectedId: null,
      tab: "explore",
      theme: "system",
      favorites: {},
      reports: {},
      introSeen: false,
      hoverId: null,

      setCenter: (center, centerSource) => set({ center, centerSource }),
      setRadius: (radiusKm) => set({ radiusKm }),
      toggleCategory: (c) =>
        set((s) => ({
          categories: s.categories.includes(c) ? s.categories.filter((x) => x !== c) : [...s.categories, c],
        })),
      clearCategories: () => set({ categories: [] }),
      setQuery: (query) => set({ query }),
      toggleFlag: (k) => set((s) => ({ [k]: !s[k] }) as Partial<State>),
      select: (selectedId) => set({ selectedId }),
      setTab: (tab) => set({ tab, selectedId: null }),
      setTheme: (theme) => set({ theme }),
      toggleFavorite: (id) =>
        set((s) => {
          const favorites = { ...s.favorites };
          if (favorites[id]) delete favorites[id];
          else favorites[id] = { addedAt: Date.now(), visits: [], note: "" };
          return { favorites };
        }),
      logVisit: (id) =>
        set((s) => {
          const f = s.favorites[id] ?? { addedAt: Date.now(), visits: [], note: "" };
          return { favorites: { ...s.favorites, [id]: { ...f, visits: [...f.visits, Date.now()] } } };
        }),
      undoVisit: (id) =>
        set((s) => {
          const f = s.favorites[id];
          if (!f) return {};
          return { favorites: { ...s.favorites, [id]: { ...f, visits: f.visits.slice(0, -1) } } };
        }),
      setNote: (id, note) =>
        set((s) => {
          const f = s.favorites[id];
          if (!f) return {};
          return { favorites: { ...s.favorites, [id]: { ...f, note } } };
        }),
      report: (id, level) =>
        set((s) => ({ reports: { ...s.reports, [id]: [...(s.reports[id] ?? []), { ts: Date.now(), level }].slice(-40) } })),
      dismissIntro: () => set({ introSeen: true }),
      hover: (hoverId) => set({ hoverId }),
    }),
    {
      name: "sportmapa",
      version: 1,
      partialize: (s) => ({
        radiusKm: s.radiusKm,
        categories: s.categories,
        noSurcharge: s.noSurcharge,
        kidsOnly: s.kidsOnly,
        nonstop: s.nonstop,
        parking: s.parking,
        theme: s.theme,
        favorites: s.favorites,
        reports: s.reports,
        introSeen: s.introSeen,
      }),
    },
  ),
);
