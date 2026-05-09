/**
 * MultiSport Scraper - Cloudflare Worker with Cron Trigger
 *
 * Fetches facility data from MultiSport partner map API,
 * normalizes it, and stores in D1 database.
 *
 * Schedule: Once daily at 03:00 UTC
 */

import { getAccessToken } from "./auth";

export interface Env {
  DB: D1Database;
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
  };
}

interface MultiSportFacilityDetail {
  id: string;
  name: string;
  street: string;
  number: string;
  city: string;
  activity: Array<{ id: number; name: string; search_type: string }>;
  additional_payment: boolean;
  additional_payment_desc: string | null;
  is_new: boolean;
  recommended: boolean;
  description: string | null;
  website_url: string | null;
  phone: string | null;
  main_image: { thumbnail_800_600: string } | null;
  icon_name: string;
}

/**
 * Map MultiSport icon_name to our category system
 */
function mapCategory(
  iconName: string,
  activities: string[]
): string {
  const icon = iconName.toLowerCase();
  const acts = activities.map((a) => a.toLowerCase()).join(" ");

  if (icon.includes("fitness") || icon.includes("gym") || acts.includes("fitness")) {
    return "fitness";
  }
  if (icon.includes("swim") || icon.includes("plav") || acts.includes("plavání")) {
    return "swimming";
  }
  if (icon.includes("wellness") || icon.includes("sauna") || acts.includes("sauna") || acts.includes("wellness")) {
    return "wellness";
  }
  if (icon.includes("yoga") || icon.includes("jóga") || acts.includes("jóga") || acts.includes("yoga")) {
    return "yoga";
  }
  if (icon.includes("water") || icon.includes("paddle") || icon.includes("kajak") || acts.includes("paddleboard")) {
    return "water";
  }

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
      const detail = details[j];
      const [lng, lat] = feature.geometry.coordinates;

      const activities = detail?.activity?.map((a) => a.name) || [];
      const category = mapCategory(
        feature.properties.icon_name,
        activities
      );

      const address = detail
        ? `${detail.street} ${detail.number}, ${detail.city}`
        : feature.properties.name;

      try {
        await env.DB.prepare(
          `INSERT OR REPLACE INTO facilities 
           (id, name, address, city, lat, lng, category, activities, image_url, website_url, phone, description, is_new, recommended, additional_payment, raw_data, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        )
          .bind(
            feature.id,
            detail?.name || feature.properties.name,
            address,
            detail?.city || "Praha",
            lat,
            lng,
            category,
            JSON.stringify(activities),
            detail?.main_image?.thumbnail_800_600 || null,
            detail?.website_url || null,
            detail?.phone || null,
            detail?.description || null,
            detail?.is_new ? 1 : 0,
            detail?.recommended ? 1 : 0,
            detail?.additional_payment ? 1 : 0,
            JSON.stringify(detail)
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

/**
 * Worker entry point
 */
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

  // HTTP handler (for manual trigger / testing)
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/scrape") {
      try {
        const result = await scrapeFacilities(env);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Health check
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", time: new Date().toISOString() }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("MultiSuggest Scraper Worker", { status: 200 });
  },
};
