#!/usr/bin/env node
/**
 * MultiSuggest Scraper - runs locally or in CI (GitHub Actions)
 * 
 * Usage: node scripts/scrape.mjs
 * 
 * This script:
 * 1. Executes auth.js from MultiSport to get a valid JWT token
 * 2. Fetches all facility data from their API
 * 3. Filters to Prague, free-entry only
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
  const acts = activities.map(a => a.toLowerCase()).join(" ");
  const name = facilityName.toLowerCase();
  
  // Check icon_name first (most reliable)
  if (icon.includes("fitness") || icon.includes("posilovn")) return "fitness";
  if (icon.includes("swim") || icon.includes("plav") || icon.includes("bazen")) return "swimming";
  if (icon.includes("wellness") || icon.includes("sauna")) return "wellness";
  if (icon.includes("yoga") || icon.includes("joga")) return "yoga";
  if (icon.includes("water") || icon.includes("paddle") || icon.includes("kajak")) return "water";
  
  // Check activities
  if (acts.includes("gym") || acts.includes("fitness") || acts.includes("circuit") || acts.includes("crossfit") || acts.includes("functional")) return "fitness";
  if (acts.includes("swim") || acts.includes("plav") || acts.includes("aqua")) return "swimming";
  if (acts.includes("sauna") || acts.includes("wellness") || acts.includes("masáž") || acts.includes("massage")) return "wellness";
  if (acts.includes("yoga") || acts.includes("jóga") || acts.includes("pilates")) return "yoga";
  if (acts.includes("paddle") || acts.includes("kajak") || acts.includes("canoe")) return "water";
  
  // Fallback: check facility name
  if (name.includes("fitness") || name.includes("gym") || name.includes("posilovna") || name.includes("crossfit") || name.includes("fitko")) return "fitness";
  if (name.includes("yoga") || name.includes("jóga") || name.includes("pilates")) return "yoga";
  if (name.includes("bazén") || name.includes("plaveck") || name.includes("aqua") || name.includes("swim")) return "swimming";
  if (name.includes("sauna") || name.includes("wellness") || name.includes("spa") || name.includes("lázně")) return "wellness";
  if (name.includes("paddle") || name.includes("sup ") || name.includes("kajak") || name.includes("lodě")) return "water";
  
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
  
  for (let i = 0; i < pragueFeatures.length; i++) {
    const feature = pragueFeatures[i];
    const [lng, lat] = feature.geometry.coordinates;
    
    const rawDetail = await fetchDetail(feature.id, token);
    
    // Wait between requests (1 second)
    await sleep(1000);
    
    // Detail API returns GeoJSON Feature with properties
    const detail = rawDetail?.properties || rawDetail;
    
    // Skip if explicitly has surcharge
    if (detail?.additional_payment) continue;

    const activities = detail?.activity?.map(a => a.name) || [];
    const facilityName = detail?.name || feature.properties.name;
    const category = mapCategory(feature.properties.icon_name, activities, facilityName);

    facilities.push({
      id: String(feature.id),
      name: detail?.name || feature.properties.name,
      address: detail ? `${detail.street || ""} ${detail.number || ""}, ${detail.city || "Praha"}`.trim() : "",
      city: detail?.city || "Praha",
      lat, lng,
      category,
      activities,
      image_url: detail?.main_image?.thumbnail_800_600 || null,
      website_url: detail?.website_url || null,
      phone: detail?.phone || null,
      description: detail?.description || null,
      is_new: detail?.is_new || false,
      recommended: detail?.recommended || false,
    });

    if (i % 10 === 0) {
      process.stdout.write(`\r[Scrape] Progress: ${i}/${pragueFeatures.length} (${facilities.length} free)`);
    }
  }

  console.log(`\n[Scrape] Final: ${facilities.length} free facilities in Prague`);

  // Write output
  const outPath = resolve(__dirname, "../src/data/facilities.json");
  writeFileSync(outPath, JSON.stringify(facilities, null, 2));
  console.log(`[Done] Written to ${outPath}`);
}

main().catch(err => {
  console.error("[Error]", err);
  process.exit(1);
});
