#!/usr/bin/env node
/**
 * MultiSuggest Scraper - runs locally or in CI (GitHub Actions)
 * 
 * Usage: node scripts/scrape.mjs
 * 
 * This script:
 * 1. Executes auth.js from MultiSport to get a valid JWT token
 * 2. Fetches all facility data from their API
 * 3. Filters to Prague
 * 4. Outputs to src/data/facilities.json (bundled with the frontend)
 * 
 * Run this periodically (weekly/monthly) and redeploy.
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MAP_PAGE_URL = "https://mapa.multisport.cz/cs/";
const AUTH_JS_URL = "https://cz0appsearchengine0prod.blob.core.windows.net/prod/static/js/auth.js?v=4.0";

// Prague bounding box
const PRAGUE_BOUNDS = {
  minLat: 49.94, maxLat: 50.18,
  minLng: 14.22, maxLng: 14.71,
};

function isInPrague(lat, lng) {
  return lat >= PRAGUE_BOUNDS.minLat && lat <= PRAGUE_BOUNDS.maxLat &&
         lng >= PRAGUE_BOUNDS.minLng && lng <= PRAGUE_BOUNDS.maxLng;
}

function mapCategory(iconName, activities, facilityName = "") {
  const icon = (iconName || "").toLowerCase();
  const acts = activities.map(a => (a.name || a).toLowerCase()).join(" ");
  const actIcons = activities.map(a => (a.icon_name || "").toLowerCase()).join(" ");
  const name = facilityName.toLowerCase();
  
  // Direct icon_name mapping (most reliable - from API)
  if (icon.includes("posilovn") || icon.includes("silove")) return "fitness";
  if (icon.includes("bazen") || icon.includes("vodni") || icon.includes("plav")) return "swimming";
  if (icon.includes("wellness") || icon.includes("relax")) return "wellness";
  if (icon.includes("joga") || icon.includes("zdravotni")) return "yoga";
  if (icon.includes("skupinove") || icon.includes("tanecni")) return "group";
  if (icon.includes("raketove") || icon.includes("micove")) return "sports";
  if (icon.includes("lezeck")) return "climbing";
  if (icon.includes("rodice") || icon.includes("deti") || icon.includes("detmi")) return "kids";
  if (icon.includes("sezonni") || icon.includes("ostatni")) return "outdoor";

  // For "mix_aktivit" - analyze activities to determine best category
  if (icon === "mix_aktivit" || icon === "") {
    // Count activity icon_name occurrences to pick dominant category
    const iconCounts = {};
    for (const a of activities) {
      const ai = (a.icon_name || "").toLowerCase();
      if (ai) iconCounts[ai] = (iconCounts[ai] || 0) + 1;
    }
    
    // Map activity icons to categories and pick dominant
    for (const [ai, count] of Object.entries(iconCounts).sort((a, b) => b[1] - a[1])) {
      if (ai.includes("posilovn") || ai.includes("silove")) return "fitness";
      if (ai.includes("bazen") || ai.includes("vodni") || ai.includes("plav")) return "swimming";
      if (ai.includes("wellness") || ai.includes("relax")) return "wellness";
      if (ai.includes("joga") || ai.includes("zdravotni")) return "yoga";
      if (ai.includes("skupinove") || ai.includes("tanecni")) return "group";
      if (ai.includes("raketove") || ai.includes("micove")) return "sports";
      if (ai.includes("lezeck")) return "climbing";
    }
  }

  // Check activity icon_names (secondary)
  if (actIcons.includes("posilovn")) return "fitness";
  if (actIcons.includes("plav") || actIcons.includes("bazen") || actIcons.includes("vodni")) return "swimming";
  if (actIcons.includes("wellness") || actIcons.includes("relax")) return "wellness";
  if (actIcons.includes("joga") || actIcons.includes("zdravotni")) return "yoga";
  if (actIcons.includes("skupinove") || actIcons.includes("tanecni")) return "group";
  if (actIcons.includes("raketove") || actIcons.includes("micove")) return "sports";
  if (actIcons.includes("lezeck")) return "climbing";

  // Check activities text
  if (acts.includes("gym") || acts.includes("fitness") || acts.includes("circuit") || acts.includes("crossfit") || acts.includes("functional")) return "fitness";
  if (acts.includes("swim") || acts.includes("plav") || acts.includes("aqua")) return "swimming";
  if (acts.includes("sauna") || acts.includes("wellness") || acts.includes("masáž") || acts.includes("massage") || acts.includes("salt cave")) return "wellness";
  if (acts.includes("yoga") || acts.includes("jóga") || acts.includes("pilates") || acts.includes("health exercise")) return "yoga";
  if (acts.includes("paddle") || acts.includes("kajak") || acts.includes("canoe")) return "swimming";
  if (acts.includes("tennis") || acts.includes("squash") || acts.includes("badminton") || acts.includes("table tennis") || acts.includes("padel")) return "sports";
  if (acts.includes("climbing") || acts.includes("bouldering") || acts.includes("lezení")) return "climbing";
  if (acts.includes("dance") || acts.includes("zumba") || acts.includes("bodystyling") || acts.includes("aerobic") || acts.includes("spinning")) return "group";
  
  // Fallback: check facility name
  if (name.includes("fitness") || name.includes("gym") || name.includes("posilovna") || name.includes("crossfit") || name.includes("fitko")) return "fitness";
  if (name.includes("yoga") || name.includes("jóga") || name.includes("pilates")) return "yoga";
  if (name.includes("bazén") || name.includes("plaveck") || name.includes("aqua") || name.includes("swim")) return "swimming";
  if (name.includes("sauna") || name.includes("wellness") || name.includes("spa") || name.includes("lázně")) return "wellness";
  if (name.includes("paddle") || name.includes("sup ") || name.includes("kajak") || name.includes("lodě")) return "swimming";
  if (name.includes("tenis") || name.includes("squash") || name.includes("padel") || name.includes("badminton")) return "sports";
  if (name.includes("lezeck") || name.includes("boulder") || name.includes("climbing")) return "climbing";
  if (name.includes("dance") || name.includes("tanec") || name.includes("zumba")) return "group";
  
  // Check common gym brand names
  if (name.includes("john reed") || name.includes("holmes place") || name.includes("balance club") || name.includes("gold's")) return "fitness";
  
  return "other";
}

async function getAccessToken() {
  console.log("[Auth] Fetching page config...");
  const pageRes = await fetch(MAP_PAGE_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
  });
  const html = await pageRes.text();
  
  const saltMatch = html.match(/window\.salt\s*=\s*"([^"]+)"/);
  const n1Match = html.match(/var\s+n1\s*=\s*new\s+Date\((\d+)\)/);
  if (!saltMatch || !n1Match) throw new Error("Cannot extract auth config from page");
  
  const salt = saltMatch[1];
  const offset = parseInt(n1Match[1]) - Date.now();

  console.log("[Auth] Fetching auth.js...");
  const authRes = await fetch(AUTH_JS_URL);
  const authJs = await authRes.text();

  console.log("[Auth] Generating token...");
  const mockEnv = `
    var window = { salt: "${salt}", offset: ${offset}, jwt_token_url: '/api/v1/token/', jwt_refresh_token_url: '/api/v1/token/refresh/', refreshTokenTimeout: 51000, isSecure: true, location: { href: "https://mapa.multisport.cz/cs/" } };
    var document = { dispatchEvent: function(){} };
    var localStorage = { _data: {}, getItem: function(k) { return this._data[k] || null; }, setItem: function(k, v) { this._data[k] = v; }, removeItem: function(k) { delete this._data[k]; } };
    var _capturedPost = null;
    var $ = function(el) { return { ready: function(cb) { cb(); } }; };
    $.post = function(url, data, cb) { _capturedPost = { url, data }; return { fail: function() { return this; } }; };
    var setInterval = function(){};
    var userAuthenticatedEvent = {};
    var CustomEvent = function(name, opts) { return {name, opts}; };
  `;

  const fn = new Function(mockEnv + "\n" + authJs + "\n; return _capturedPost;");
  const result = fn();
  
  if (!result?.data) throw new Error("auth.js did not produce token");

  console.log("[Auth] Exchanging for JWT...");
  const tokenRes = await fetch("https://mapa.multisport.cz/api/v1/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://mapa.multisport.cz",
      "Referer": "https://mapa.multisport.cz/cs/",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify(result.data),
  });

  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`);
  const { access } = await tokenRes.json();
  console.log("[Auth] Got JWT token");
  return access;
}

async function fetchFacilities(token) {
  console.log("[Scrape] Fetching all facilities...");
  const res = await fetch("https://mapa.multisport.cz/api/v1/facility/facilities/", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`Facilities fetch failed: ${res.status}`);
  const geojson = await res.json();
  console.log(`[Scrape] Got ${geojson.features.length} total facilities`);
  return geojson.features;
}

async function fetchDetail(id, token, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`https://mapa.multisport.cz/api/v1/facility/${id}/`, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
      });
      if (res.status === 429) {
        // Rate limited - wait longer and retry
        await sleep(5000);
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch { 
      if (attempt < retries - 1) await sleep(2000);
    }
  }
  return null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const token = await getAccessToken();
  const features = await fetchFacilities(token);

  // Filter to Prague
  const pragueFeatures = features.filter(f => {
    const [lng, lat] = f.geometry.coordinates;
    return isInPrague(lat, lng);
  });
  console.log(`[Scrape] ${pragueFeatures.length} facilities in Prague`);

  // Fetch details SEQUENTIALLY with delay (avoid rate limiting)
  const facilities = [];
  const scrapeTimestamp = new Date().toISOString();
  
  for (let i = 0; i < pragueFeatures.length; i++) {
    const feature = pragueFeatures[i];
    const [lng, lat] = feature.geometry.coordinates;
    
    const rawDetail = await fetchDetail(feature.id, token);
    
    // Wait between requests (3 seconds to avoid rate limiting)
    await sleep(3000);

    // Extra pause every 30 requests (rate-limit safety)
    if (i > 0 && i % 30 === 0) {
      console.log(`\n[Scrape] Pausing 30s after ${i} requests...`);
      await sleep(30000);
    }
    
    // Detail API returns GeoJSON Feature with properties
    const detail = rawDetail?.properties || rawDetail;
    
    if (!detail) continue;

    const activities = detail?.activity || [];
    const activityNames = activities.map(a => a.name);
    const facilityName = detail?.name || feature.properties.name;
    const category = mapCategory(feature.properties.icon_name, activities, facilityName);

    // Extract active cards
    const activeCards = detail?.active_cards?.visible?.map(card => ({
      name: card.name,
      id: card.id,
      description: card.description,
    })) || [];

    // Extract gallery images
    const galleryImages = detail?.galery_images?.map(img => img.thumbnail_800_600).filter(Boolean) || [];

    facilities.push({
      id: String(feature.id),
      name: facilityName,
      address: `${detail.street || ""} ${detail.number || ""}, ${detail.city || "Praha"}`.trim(),
      city: detail?.city || "Praha",
      lat, lng,
      category,
      activities: activityNames,
      activity_summary: detail?.activity_summary || null,
      image_url: detail?.main_image?.thumbnail_800_600 || null,
      gallery_images: galleryImages,
      website_url: detail?.website_url || null,
      phone: detail?.phone || null,
      email: detail?.email || null,
      description: detail?.description || null,
      is_new: detail?.is_new || false,
      recommended: detail?.recommended || false,
      additional_payment: detail?.additional_payment || false,
      additional_payment_desc: detail?.additional_payment_desc || null,
      active_cards: activeCards,
      kids_activities: detail?.kids_activities || false,
      only_virtual_card: detail?.only_virtual_card || false,
      parking: detail?.parking || "Unknown",
      self_service: detail?.self_service || false,
      self_service_times: detail?.self_service_times || null,
      unlimited_oh: detail?.unlimited_oh || false,
      facebook_url: detail?.facebook_url || null,
      instagram_url: detail?.instagram_url || null,
    });

    if (i % 10 === 0) {
      process.stdout.write(`\r[Scrape] Progress: ${i}/${pragueFeatures.length} (${facilities.length} found)`);
    }
  }

  console.log(`\n[Scrape] Final: ${facilities.length} facilities in Prague`);

  // Write output with metadata
  const output = {
    scraped_at: scrapeTimestamp,
    total: facilities.length,
    facilities,
  };
  
  const outPath = resolve(__dirname, "../src/data/facilities.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`[Done] Written to ${outPath}`);
}

main().catch(err => {
  console.error("[Error]", err);
  process.exit(1);
});
