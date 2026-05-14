/**
 * MultiSport Scraper + API - Cloudflare Worker
 *
 * 1. Cron: Fetches facility data from MultiSport partner map API daily
 * 2. API: Serves facility data to the frontend from D1
 *
 * Schedule: Once daily at 03:00 UTC
 */

import { getAccessToken } from "./auth";

export interface Env {
  DB: D1Database;
}

interface FacilityRow {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  category: string;
  activities: string;
  image_url: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  is_new: number;
  recommended: number;
  additional_payment: number;
  additional_payment_desc: string | null;
  active_cards: string;
  kids_activities: number;
  gallery_images: string;
  parking: string | null;
  only_virtual_card: number;
  activity_summary: string | null;
  self_service: number;
  self_service_times: string | null;
  unlimited_oh: number;
  facebook_url: string | null;
  instagram_url: string | null;
  updated_at: string;
}

interface MultiSportFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    name: string;
    icon_name: string;
    only_virtual_card: boolean;
    recommended: boolean;
    is_new: boolean;
  };
}

interface ActiveCard {
  name: string;
  id: number;
  description: string;
  image_url: string;
  preselected: boolean;
}

interface MultiSportFacilityDetail {
  id: string;
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    name: string;
    street: string;
    number: string;
    city: string;
    activity: Array<{
      id: number;
      name: string;
      search_type: string;
      icon_name: string;
      url: string;
    }>;
    additional_payment: boolean;
    additional_payment_desc: string | null;
    is_new: boolean;
    recommended: boolean;
    description: string | null;
    website_url: string | null;
    phone: string | null;
    email: string | null;
    main_image: {
      thumbnail_60_45: string;
      thumbnail_400_300: string;
      thumbnail_800_600: string;
    } | null;
    logo_image: string | null;
    galery_images: Array<{
      thumbnail_60_45: string;
      thumbnail_400_300: string;
      thumbnail_800_600: string;
    }>;
    facebook_url: string | null;
    instagram_url: string | null;
    icon_name: string;
    kids_activities: boolean;
    active_cards: {
      visible: ActiveCard[];
      hidden: ActiveCard[];
      any: boolean;
    };
    only_virtual_card: boolean;
    self_service: boolean;
    self_service_times: string;
    self_service_full_day: boolean;
    unlimited_oh: boolean;
    parking: string;
    air_condition: boolean | null;
    activity_summary: string;
    url: string;
  };
}

/**
 * Map MultiSport icon_name to our category system
 */
function mapCategory(
  iconName: string,
  activities: Array<{ name: string; icon_name?: string }>,
  facilityName: string = ""
): string {
  const icon = iconName.toLowerCase();
  const acts = activities.map((a) => a.name.toLowerCase()).join(" ");
  const actIcons = activities.map((a) => (a.icon_name || "").toLowerCase()).join(" ");
  const name = facilityName.toLowerCase();

  // Check icon_name first (most reliable)
  if (icon.includes("posilovn") || icon.includes("fitness")) return "fitness";
  if (icon.includes("swim") || icon.includes("plav") || icon.includes("bazen")) return "swimming";
  if (icon.includes("wellness") || icon.includes("sauna") || icon.includes("relax")) return "wellness";
  if (icon.includes("joga") || icon.includes("yoga") || icon.includes("zdravotni")) return "yoga";
  if (icon.includes("water") || icon.includes("paddle") || icon.includes("kajak") || icon.includes("vodni")) return "water";

  // Check activity icon_names
  if (actIcons.includes("posilovn")) return "fitness";
  if (actIcons.includes("plav") || actIcons.includes("bazen")) return "swimming";
  if (actIcons.includes("wellness") || actIcons.includes("relax")) return "wellness";
  if (actIcons.includes("joga") || actIcons.includes("zdravotni")) return "yoga";

  // Check activity names
  if (acts.includes("gym") || acts.includes("fitness") || acts.includes("circuit") || acts.includes("crossfit") || acts.includes("functional")) return "fitness";
  if (acts.includes("swim") || acts.includes("plav") || acts.includes("aqua")) return "swimming";
  if (acts.includes("sauna") || acts.includes("wellness") || acts.includes("massage") || acts.includes("masáž")) return "wellness";
  if (acts.includes("yoga") || acts.includes("jóga") || acts.includes("pilates")) return "yoga";
  if (acts.includes("paddle") || acts.includes("kajak") || acts.includes("canoe")) return "water";

  // Fallback: check facility name
  if (name.includes("fitness") || name.includes("gym") || name.includes("posilovna") || name.includes("crossfit") || name.includes("fitko")) return "fitness";
  if (name.includes("yoga") || name.includes("jóga") || name.includes("pilates")) return "yoga";
  if (name.includes("bazén") || name.includes("plaveck") || name.includes("aqua") || name.includes("swim")) return "swimming";
  if (name.includes("sauna") || name.includes("wellness") || name.includes("spa") || name.includes("lázně")) return "wellness";
  if (name.includes("paddle") || name.includes("sup ") || name.includes("kajak") || name.includes("lodě")) return "water";

  // Common gym brand names
  if (name.includes("john reed") || name.includes("holmes place") || name.includes("balance club") || name.includes("gold's")) return "fitness";

  return "other";
}

/**
 * Prague bounding box for filtering
 */
const PRAGUE_BOUNDS = {
  minLat: 49.94,
  maxLat: 50.18,
  minLng: 14.22,
  maxLng: 14.71,
};

function isInPrague(lat: number, lng: number): boolean {
  return (
    lat >= PRAGUE_BOUNDS.minLat &&
    lat <= PRAGUE_BOUNDS.maxLat &&
    lng >= PRAGUE_BOUNDS.minLng &&
    lng <= PRAGUE_BOUNDS.maxLng
  );
}

/**
 * Main scraper logic
 */
async function scrapeFacilities(env: Env): Promise<{ total: number; inserted: number }> {
  console.log("[Scraper] Starting MultiSport data fetch...");

  // 1. Get auth token
  const token = await getAccessToken();
  console.log("[Scraper] Got access token");

  // 2. Fetch all facilities (GeoJSON)
  const facilitiesRes = await fetch(
    "https://mapa.multisport.cz/api/v1/facility/facilities/",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!facilitiesRes.ok) {
    throw new Error(`Facilities fetch failed: ${facilitiesRes.status}`);
  }

  const geojson = (await facilitiesRes.json()) as {
    type: "FeatureCollection";
    features: MultiSportFeature[];
  };

  console.log(`[Scraper] Fetched ${geojson.features.length} total facilities`);

  // 3. Filter to Prague area
  const pragueFeatures = geojson.features.filter((f) => {
    const [lng, lat] = f.geometry.coordinates;
    return isInPrague(lat, lng);
  });

  console.log(`[Scraper] ${pragueFeatures.length} facilities in Prague`);

  // 4. Fetch details for each and upsert to DB
  let inserted = 0;

  // Process in batches of 10 to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < pragueFeatures.length; i += batchSize) {
    const batch = pragueFeatures.slice(i, i + batchSize);

    const details = await Promise.all(
      batch.map(async (feature) => {
        try {
          const detailRes = await fetch(
            `https://mapa.multisport.cz/api/v1/facility/${feature.id}/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );

          if (!detailRes.ok) return null;
          return (await detailRes.json()) as MultiSportFacilityDetail;
        } catch {
          return null;
        }
      })
    );

    // Upsert to D1
    for (let j = 0; j < batch.length; j++) {
      const feature = batch[j];
      const rawDetail = details[j];
      const detail = rawDetail?.properties || null;
      const [lng, lat] = feature.geometry.coordinates;

      const activities = detail?.activity || [];
      const activityNames = activities.map((a) => a.name);
      const facilityName = detail?.name || feature.properties.name;
      const category = mapCategory(
        feature.properties.icon_name,
        activities,
        facilityName
      );

      const address = detail
        ? `${detail.street || ""} ${detail.number || ""}, ${detail.city || "Praha"}`.trim()
        : "";

      // Extract gallery images (800x600 thumbnails)
      const galleryImages = detail?.galery_images?.map((img) => img.thumbnail_800_600) || [];

      // Extract active cards
      const activeCards = detail?.active_cards?.visible?.map((card) => ({
        name: card.name,
        id: card.id,
        description: card.description,
      })) || [];

      try {
        await env.DB.prepare(
          `INSERT OR REPLACE INTO facilities 
           (id, name, address, city, lat, lng, category, activities, image_url, website_url, phone, description, is_new, recommended, additional_payment, additional_payment_desc, active_cards, kids_activities, gallery_images, email, parking, only_virtual_card, activity_summary, self_service, self_service_times, unlimited_oh, facebook_url, instagram_url, raw_data, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        )
          .bind(
            String(feature.id),
            facilityName,
            address,
            detail?.city || "Praha",
            lat,
            lng,
            category,
            JSON.stringify(activityNames),
            detail?.main_image?.thumbnail_800_600 || null,
            detail?.website_url || null,
            detail?.phone || null,
            detail?.description || null,
            detail?.is_new ? 1 : 0,
            detail?.recommended ? 1 : 0,
            detail?.additional_payment ? 1 : 0,
            detail?.additional_payment_desc || null,
            JSON.stringify(activeCards),
            detail?.kids_activities ? 1 : 0,
            JSON.stringify(galleryImages),
            detail?.email || null,
            detail?.parking || "Unknown",
            detail?.only_virtual_card ? 1 : 0,
            detail?.activity_summary || null,
            detail?.self_service ? 1 : 0,
            detail?.self_service_times || null,
            detail?.unlimited_oh ? 1 : 0,
            detail?.facebook_url || null,
            detail?.instagram_url || null,
            JSON.stringify(rawDetail)
          )
          .run();

        inserted++;
      } catch (err) {
        console.error(`[Scraper] Failed to insert ${feature.id}:`, err);
      }
    }

    // Small delay between batches
    if (i + batchSize < pragueFeatures.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`[Scraper] Done. Inserted/updated ${inserted} facilities.`);
  return { total: pragueFeatures.length, inserted };
}

// ============================================================
// API ENDPOINTS
// ============================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

/**
 * GET /api/facilities
 * Query params:
 *   - lat (required): user latitude
 *   - lng (required): user longitude
 *   - radius (optional, default 10): km
 *   - category (optional): filter by category
 *   - free_only (optional, "1"): only facilities without additional payment
 *   - kids (optional, "1"): only kids-friendly
 *   - limit (optional, default 50): max results
 */
async function handleFacilitiesApi(url: URL, env: Env): Promise<Response> {
  const lat = parseFloat(url.searchParams.get("lat") || "50.08");
  const lng = parseFloat(url.searchParams.get("lng") || "14.43");
  const radius = parseFloat(url.searchParams.get("radius") || "10");
  const category = url.searchParams.get("category") || null;
  const freeOnly = url.searchParams.get("free_only") === "1";
  const kidsOnly = url.searchParams.get("kids") === "1";
  const limit = parseInt(url.searchParams.get("limit") || "50");

  // Build query
  const whereConditions = ["1=1"];
  const params: (string | number)[] = [];

  if (category) {
    whereConditions.push("category = ?");
    params.push(category);
  }

  if (freeOnly) {
    whereConditions.push("additional_payment = 0");
  }

  if (kidsOnly) {
    whereConditions.push("kids_activities = 1");
  }

  // Rough bounding box filter first (for performance)
  // 1 degree lat ≈ 111 km, 1 degree lng ≈ 71 km at 50°N
  const latDelta = radius / 111;
  const lngDelta = radius / 71;
  whereConditions.push("lat BETWEEN ? AND ?");
  params.push(lat - latDelta, lat + latDelta);
  whereConditions.push("lng BETWEEN ? AND ?");
  params.push(lng - lngDelta, lng + lngDelta);

  // Use a larger internal limit for the SQL query, then filter by exact haversine
  const sqlLimit = 1000;

  const query = `
    SELECT id, name, address, city, lat, lng, category, activities, image_url, 
           website_url, phone, description, is_new, recommended, additional_payment,
           additional_payment_desc, active_cards, kids_activities, gallery_images,
           email, parking, only_virtual_card, activity_summary, self_service,
           self_service_times, unlimited_oh, facebook_url, instagram_url, updated_at
    FROM facilities
    WHERE ${whereConditions.join(" AND ")}
    LIMIT ?
  `;
  params.push(sqlLimit);

  const result = await env.DB.prepare(query).bind(...params).all();

  // Enrich with distance and parse JSON fields
  const facilities = (result.results || []).map((row: FacilityRow) => {
    const distance = haversineDistance(lat, lng, row.lat, row.lng);
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      lat: row.lat,
      lng: row.lng,
      category: row.category,
      activities: JSON.parse(row.activities || "[]"),
      image_url: row.image_url,
      website_url: row.website_url,
      phone: row.phone,
      email: row.email,
      description: row.description,
      is_new: row.is_new === 1,
      recommended: row.recommended === 1,
      additional_payment: row.additional_payment === 1,
      additional_payment_desc: row.additional_payment_desc,
      active_cards: JSON.parse(row.active_cards || "[]"),
      kids_activities: row.kids_activities === 1,
      gallery_images: JSON.parse(row.gallery_images || "[]"),
      parking: row.parking,
      only_virtual_card: row.only_virtual_card === 1,
      activity_summary: row.activity_summary,
      self_service: row.self_service === 1,
      self_service_times: row.self_service_times,
      unlimited_oh: row.unlimited_oh === 1,
      facebook_url: row.facebook_url,
      instagram_url: row.instagram_url,
      distance,
      updated_at: row.updated_at,
    };
  });

  // Sort by distance
  facilities.sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance);

  // Filter by exact radius (haversine, not bounding box)
  const filtered = facilities.filter((f: { distance: number }) => f.distance <= radius).slice(0, limit);

  // Get last sync time
  const syncResult = await env.DB.prepare(
    "SELECT MAX(updated_at) as last_sync FROM facilities"
  ).first<{ last_sync: string }>();

  return jsonResponse({
    facilities: filtered,
    meta: {
      total: filtered.length,
      last_sync: syncResult?.last_sync || null,
      radius_km: radius,
    },
  });
}

/**
 * Haversine distance in km
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================
// WORKER ENTRY POINT
// ============================================================

export default {
  // Cron trigger handler
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    try {
      const result = await scrapeFacilities(env);
      console.log(`[Cron] Scrape complete: ${result.inserted}/${result.total}`);
    } catch (err) {
      console.error("[Cron] Scrape failed:", err);
    }
  },

  // HTTP handler
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // API endpoints
    if (url.pathname === "/api/facilities") {
      return handleFacilitiesApi(url, env);
    }

    // Manual scrape trigger
    if (url.pathname === "/scrape") {
      try {
        const result = await scrapeFacilities(env);
        return jsonResponse(result);
      } catch (err: unknown) {
        return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
      }
    }

    // Health check
    if (url.pathname === "/health") {
      return jsonResponse({ status: "ok", time: new Date().toISOString() });
    }

    return new Response("MultiSuggest API Worker", { status: 200 });
  },
};
