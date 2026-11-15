export type Category =
  | "fitness" | "swimming" | "wellness" | "yoga" | "group"
  | "racket" | "climbing" | "outdoor" | "kids" | "other";

export interface Facility {
  id: string;
  name: string;
  street: string;
  city: string | null;
  lat: number;
  lng: number;
  category: Category;
  categories: Category[];
  activities: string[];
  image: string | null;
  thumb?: string | null; // 400×300 variant for list avatars
  gallery: string[];
  web: string | null;
  facebook: string | null;
  instagram: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  surcharge: boolean;
  surchargeNote: string | null;
  kids: boolean;
  virtualOnly: boolean;
  parking: boolean | null;
  selfService: boolean;
  selfServiceTimes: string | null;
  nonstop: boolean;
  isNew: boolean;
  recommended: boolean;
  cards: string[];
  hours?: string; // OSM opening_hours syntax
}

export interface Dataset {
  updatedAt: string;
  checkedAt?: string; // last successful pipeline run (updatedAt changes only with the data)
  hoursUpdatedAt?: string;
  source?: string;
  hoursSource?: string;
  count: number;
  facilities: Facility[];
}

export interface Located extends Facility {
  distance: number; // km from search center
}

export type LngLat = { lat: number; lng: number };
