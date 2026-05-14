export type CrowdLevel = "empty" | "ok" | "busy" | "full";

export type Category =
  | "fitness"
  | "swimming"
  | "wellness"
  | "yoga"
  | "water"
  | "group"
  | "sports"
  | "climbing"
  | "kids"
  | "outdoor"
  | "other";

export interface ActiveCard {
  name: string;
  id: number;
  description: string;
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  category: Category;
  activities: string[];
  activity_summary: string | null;
  image_url: string | null;
  gallery_images: string[];
  website_url: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  is_new: boolean;
  recommended: boolean;
  additional_payment: boolean;
  additional_payment_desc: string | null;
  active_cards: ActiveCard[];
  kids_activities: boolean;
  only_virtual_card: boolean;
  parking: string;
  self_service: boolean;
  self_service_times: string | null;
  unlimited_oh: boolean;
  facebook_url: string | null;
  instagram_url: string | null;
  updated_at?: string;
}

export interface FacilityWithMeta extends Facility {
  distance: number; // km
  crowdLevel: CrowdLevel;
  crowdLabel: string;
  goodTimes: string;
}

export interface FacilitiesResponse {
  facilities: FacilityWithMeta[];
  meta: {
    total: number;
    last_sync: string | null;
    radius_km: number;
  };
}

export const CATEGORY_LABELS: Record<Category, string> = {
  fitness: "Fitness",
  swimming: "Plavání",
  wellness: "Wellness",
  yoga: "Jóga",
  water: "Voda",
  group: "Lekce",
  sports: "Sporty",
  climbing: "Lezení",
  kids: "Pro děti",
  outdoor: "Outdoor",
  other: "Ostatní",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  fitness: "Dumbbell",
  swimming: "Waves",
  wellness: "Flame",
  yoga: "Heart",
  water: "Ship",
  group: "Users",
  sports: "Ball",
  climbing: "Mountain",
  kids: "Baby",
  outdoor: "Tree",
  other: "MapPin",
};

/** Card type display names */
export const CARD_LABELS: Record<number, string> = {
  1: "Stříbrná",
  2: "Dítě",
  3: "FKSP",
  4: "Student",
};
