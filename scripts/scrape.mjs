#!/usr/bin/env node
/**
 * MultiSport CZ facility scraper.
 *
 *   node scripts/scrape.mjs            # full CZ scrape (incremental: reuses cached details)
 *   node scripts/scrape.mjs --limit 50 # quick test
 *   node scripts/scrape.mjs --fresh    # ignore cache, refetch every detail
 *
 * Fixes vs. the old multi-suggest scraper:
 *  - The JWT from mapa.multisport.cz lives ~60 s. The old scraper never refreshed it,
 *    so only the first ~16 detail requests succeeded. We refresh proactively and on 401/403.
 *  - Whole Czech Republic instead of a Prague bounding box.
 *  - Failures are counted; the run fails loudly if too many details are missing,
 *    and never overwrites good data with a much smaller dataset.
 *
 * Output:
 *   public/data/facilities.json  – compact index the app loads (all facilities)
 *   data/details-cache.json      – raw normalized details keyed by id (for incremental runs)
 */

import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { categorize, categoriesFor } from "./lib/categorize.mjs";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_INDEX = resolve(ROOT, "public/data/facilities.json");
const CACHE = resolve(ROOT, "data/details-cache.json");

const BASE = "https://mapa.multisport.cz";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const args = process.argv.slice(2);
const LIMIT = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;
const FRESH = args.includes("--fresh");
const CONCURRENCY = 3;
const DELAY_MS = 350; // per worker, between requests
const CACHE_MAX_AGE_DAYS = 6; // details older than this are refetched
const TOKEN_TTL_MS = 40_000; // refresh well before the ~60 s expiry

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- auth
async function fetchPageConfig() {
  const res = await fetch(`${BASE}/cs/`, { headers: { "User-Agent": UA } });
  const html = await res.text();
  const salt = html.match(/window\.salt\s*=\s*"([^"]+)"/)?.[1];
  const n1 = html.match(/var\s+n1\s*=\s*new\s+Date\((\d+)\)/)?.[1];
  if (!salt || !n1) throw new Error("Could not extract auth config from mapa.multisport.cz");
  return { salt, offset: Number(n1) - Date.now() };
}

function generateApiAuthToken(salt, uuid, offset) {
  let t = (salt + uuid).replace(/(.)./g, "$1");
  t = t.split("").reverse().join("");
  t = t.replace(/\d+/g, (m) => String(parseInt(m) << 2));
  const interval = 60_001;
  const now = Date.now() + offset;
  const timeValue = new Date(now + interval - (now % interval)).getTime();
  const hash = createHash("md5").update(String(timeValue)).digest("hex");
  return `${t}:${hash}`;
}

let token = null;
let tokenAt = 0;
let tokenPromise = null;

async function refreshToken() {
  const { salt, offset } = await fetchPageConfig();
  const uuid = randomUUID();
  const res = await fetch(`${BASE}/api/v1/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: BASE,
      Referer: `${BASE}/cs/`,
      "User-Agent": UA,
    },
    body: JSON.stringify({ api_auth_token: generateApiAuthToken(salt, uuid, offset), uuid }),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  token = (await res.json()).access;
  tokenAt = Date.now();
  return token;
}

async function getToken(force = false) {
  if (!force && token && Date.now() - tokenAt < TOKEN_TTL_MS) return token;
  // Single-flight so parallel workers don't all re-auth at once
  tokenPromise ??= refreshToken().finally(() => (tokenPromise = null));
  return tokenPromise;
}

async function api(path, retries = 4) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const t = await getToken();
    let res;
    try {
      res = await fetch(`${BASE}${path}`, {
        headers: { Authorization: `Bearer ${t}`, Accept: "application/json", "User-Agent": UA },
      });
    } catch {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    if (res.ok) return res.json();
    if (res.status === 401 || res.status === 403) {
      await getToken(true);
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      await sleep(5000 * (attempt + 1));
      continue;
    }
    if (res.status === 404) return null;
    throw new Error(`${path} → ${res.status}`);
  }
  return undefined; // gave up
}

// ---------------------------------------------------------------- normalize
const clean = (s) => (typeof s === "string" ? s.trim() || null : null);
const url = (s) => {
  const v = clean(s);
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

function normalize(feature, raw) {
  const d = raw?.properties || raw || {};
  const [lng, lat] = feature.geometry.coordinates;
  const acts = Array.isArray(d.activity) ? d.activity : [];
  const name = clean(d.name) || feature.properties.name;
  return {
    id: String(feature.id),
    name,
    street: [clean(d.street), clean(d.number)].filter(Boolean).join(" "),
    city: clean(d.city),
    zip: clean(d.zip_code) || clean(d.postal_code),
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
    category: categorize(feature.properties.icon_name, acts, name),
    categories: categoriesFor(acts),
    activities: [...new Set(acts.map((a) => clean(a.name)).filter(Boolean))],
    image: d.main_image?.thumbnail_800_600 || null,
    gallery: (d.galery_images || d.gallery_images || [])
      .map((i) => i?.thumbnail_800_600)
      .filter(Boolean)
      .slice(0, 8),
    web: url(d.website_url),
    facebook: url(d.facebook_url),
    instagram: url(d.instagram_url),
    phone: clean(d.phone),
    email: clean(d.email),
    description: clean(d.description),
    surcharge: !!d.additional_payment,
    surchargeNote: clean(d.additional_payment_desc),
    kids: !!d.kids_activities,
    virtualOnly: !!(d.only_virtual_card ?? feature.properties.only_virtual_card),
    parking: d.parking === "Yes" ? true : d.parking === "No" ? false : null,
    selfService: !!d.self_service,
    selfServiceTimes: clean(d.self_service_times),
    nonstop: !!d.unlimited_oh,
    isNew: !!(d.is_new ?? feature.properties.is_new),
    recommended: !!(d.recommended ?? feature.properties.recommended),
    cards: (d.active_cards?.visible || []).map((c) => c.name).filter(Boolean),
  };
}

// ---------------------------------------------------------------- main
async function main() {
  const started = Date.now();
  await getToken(true);
  console.log("[auth] token ok");

  const list = await api("/api/v1/facility/facilities/");
  if (!list?.features?.length) throw new Error("Facility list empty");
  // Czech Republic bounding box (generous); the API also includes other countries' partners rarely
  const features = list.features
    .filter((f) => {
      const [lng, lat] = f.geometry.coordinates;
      return lat > 48.5 && lat < 51.1 && lng > 12.0 && lng < 18.9;
    })
    .slice(0, LIMIT);
  console.log(`[list] ${list.features.length} total, ${features.length} in CZ`);

  const cache = !FRESH && existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
  const maxAge = CACHE_MAX_AGE_DAYS * 864e5;
  const todo = features.filter((f) => {
    const c = cache[f.id];
    return !c || Date.now() - c.fetchedAt > maxAge;
  });
  console.log(`[detail] ${features.length - todo.length} cached, ${todo.length} to fetch`);

  let done = 0;
  let failed = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < todo.length) {
      const f = todo[cursor++];
      const raw = await api(`/api/v1/facility/${f.id}/`);
      if (raw === undefined) failed++;
      else if (raw) cache[f.id] = { fetchedAt: Date.now(), data: normalize(f, raw) };
      done++;
      if (done % 50 === 0 || done === todo.length) {
        const rate = done / ((Date.now() - started) / 1000);
        process.stdout.write(
          `\r[detail] ${done}/${todo.length}  failed ${failed}  ~${rate.toFixed(1)}/s   `,
        );
        // checkpoint so an interrupted run can resume
        writeJson(CACHE, cache);
      }
      await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  process.stdout.write("\n");
  writeJson(CACHE, cache);

  // Build index from list order; facilities without detail fall back to list props
  const facilities = features.map(
    (f) => cache[f.id]?.data ?? normalize(f, { properties: { name: f.properties.name } }),
  );
  const withDetail = features.filter((f) => cache[f.id]).length;
  const coverage = withDetail / features.length;
  console.log(`[result] ${facilities.length} facilities, ${(coverage * 100).toFixed(1)}% with detail`);

  // Safety: don't publish a broken dataset
  if (LIMIT === Infinity && coverage < 0.9) {
    throw new Error(`Detail coverage ${(coverage * 100).toFixed(1)}% < 90% – not publishing`);
  }
  if (LIMIT === Infinity && existsSync(OUT_INDEX)) {
    const prev = JSON.parse(readFileSync(OUT_INDEX, "utf8"));
    if (prev.facilities?.length && facilities.length < prev.facilities.length * 0.8) {
      throw new Error(`Facility count dropped ${prev.facilities.length} → ${facilities.length} – not publishing`);
    }
  }

  writeJson(OUT_INDEX, { updatedAt: new Date().toISOString(), count: facilities.length, facilities }, false);
  console.log(`[done] ${OUT_INDEX} in ${((Date.now() - started) / 60000).toFixed(1)} min`);
}

function writeJson(path, data, pretty = false) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, pretty ? 2 : 0));
}

main().catch((e) => {
  console.error("\n[error]", e.message);
  process.exit(1);
});
