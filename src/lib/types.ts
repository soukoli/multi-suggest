export type CrowdLevel = "empty" | "ok" | "busy" | "full";

export type Category =
  | "fitness"
  | "swimming"
  | "wellness"
  | "yoga"
  | "water"
  | "other";

export interface Facility {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  category: Category;
  activities: string[];
  image_url: string | null;
  website_url: string | null;
  phone: string | null;
  description: string | null;
  is_new: boolean;
  recommended: boolean;
}

export interface FacilityWithMeta extends Facility {
  distance: number; // km
  crowdLevel: CrowdLevel;
  crowdLabel: string;
  goodTimes: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  fitness: "Fitness",
  swimming: "Plavání",
  wellness: "Wellness",
  yoga: "Jóga",
  water: "Voda",
  other: "Ostatní",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  fitness: "Dumbbell",
  swimming: "Waves",
  wellness: "Flame",
  yoga: "Heart",
  water: "Ship",
  other: "MapPin",
};
