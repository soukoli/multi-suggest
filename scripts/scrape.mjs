#!/usr/bin/env node
/**
 * MultiSport CZ facility scraper.
 *
 *   node scripts/scrape.mjs            # daily: full list + details for new places and 1/7 of the rest
 *   node scripts/scrape.mjs --full     # refetch every detail (~35 min)
 *   node scripts/scrape.mjs --limit 50 # quick test (first 50 places, all details)
 *
 * Incremental strategy: the list endpoint (one request) gives every place daily, so new and
 * removed places show up the same day. Details (photos, cards, activities) are refetched for
 * new places plus a rotating seventh of the others (id % 7 == weekday), so every place is
 * refreshed weekly at ~7× less load on MultiSport than a daily full crawl.
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
 */

import vm from "node:vm";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { categorize, categoriesFor } from "./lib/categorize.mjs";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_INDEX = resolve(ROOT, "public/data/facilities.json");

const BASE = "https://mapa.multisport.cz";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const args = process.argv.slice(2);
const LIMIT = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;
const FULL = args.includes("--full") || args.includes("--fresh") || LIMIT !== Infinity;
const CONCURRENCY = 2;
const DELAY_MS = 600; // per worker, between requests
const ROTATION_DAYS = 7; // every detail refreshed at least once per this many days
const TOKEN_TTL_MS = 40_000; // refresh well before the ~60 s expiry

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- auth
// mapa.multisport.cz signs token requests with an obfuscated auth.js that changes over time
// (a hand-ported version of the algorithm stopped working). Same approach as the original
// multi-suggest CI, approved by the owner: evaluate their script with stubbed browser globals
// and capture the payload it would POST to /api/v1/token/. It runs in a separate vm context
// that has no require/process/fetch.
let authJsSource = null;

async function buildTokenPayload() {
  const html = await (await fetch(`${BASE}/cs/`, { headers: { "User-Agent": UA } })).text();
  const salt = html.match(/window\.salt\s*=\s*"([^"]+)"/)?.[1];
  const n1 = html.match(/var\s+n1\s*=\s*new\s+Date\((\d+)\)/)?.[1];
  const src = html.match(/src="([^"]*\/auth\.js[^"]*)"/)?.[1];
  if (!salt || !n1 || !src) throw new Error("Could not extract auth config from mapa.multisport.cz");
  authJsSource ??= await (await fetch(new URL(src, BASE).href, { headers: { "User-Agent": UA } })).text();

  let captured = null;
  const store = {};
  const chain = { fail: () => chain, done: () => chain, always: () => chain };
  const $ = () => ({ ready: (cb) => cb() });
  $.post = (_url, payload) => ((captured = payload), chain);
  $.ajax = (o) => ((captured = typeof o?.data === "string" ? JSON.parse(o.data) : o?.data), chain);
  const localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => (store[k] = String(v)),
    removeItem: (k) => delete store[k],
  };
  const sandbox = {
    window: {
      salt,
      offset: Number(n1) - Date.now(),
      localStorage,
      jwt_token_url: "/api/v1/token/",
      jwt_refresh_token_url: "/api/v1/token/refresh/",
      refreshTokenTimeout: 51000,
      isSecure: true,
      location: { href: `${BASE}/cs/` },
    },
    document: { dispatchEvent() {}, addEventListener() {} },
    localStorage,
    $,
    jQuery: $,
    setInterval() {},
    setTimeout() {},
    clearInterval() {},
    clearTimeout() {},
    CustomEvent: function (name, opts) { return { name, opts }; },
    userAuthenticatedEvent: {},
    console: { log() {}, warn() {}, error() {} },
  };
  vm.runInNewContext(authJsSource, vm.createContext(sandbox), { timeout: 3000 });
  if (!captured) throw new Error("auth.js did not produce a token payload");
  return typeof captured === "string" ? JSON.parse(captured) : captured;
}

let token = null;
let tokenAt = 0;
let tokenPromise = null;

async function refreshToken() {
  // A single network blip during one of ~50 refreshes must not kill a 35-minute run.
  for (let attempt = 1; ; attempt++) {
    try {
      return await requestToken();
    } catch (e) {
      if (attempt >= 4) throw e;
      authJsSource = null; // auth.js may have rotated
      await sleep(3000 * attempt);
    }
  }
}

async function requestToken() {
  const res = await fetch(`${BASE}/api/v1/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: BASE,
      Referer: `${BASE}/cs/`,
      "User-Agent": UA,
    },
    body: JSON.stringify(await buildTokenPayload()),
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
        headers: { Authorization: `Bearer ${t}`, Accept: "application/json", "Accept-Language": "cs", "User-Agent": UA },
      });
    } catch {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    if (res.ok) return res.json();
    if (res.status === 401 || res.status === 403) {
      if (t === token) await getToken(true); // others may already have refreshed it
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
// Descriptions come as HTML fragments; keep plain text with paragraph breaks.
const stripHtml = (s) =>
  clean(
    typeof s === "string"
      ? s
          .replace(/<\s*(br|\/p|\/div|\/li)\s*\/?>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/[ \t]+/g, " ")
          .replace(/\n\s*\n\s*/g, "\n\n")
      : null,
  );
const url = (s) => {
  const v = clean(s);
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

// Image URLs share a long CDN prefix; store only the path (the app re-adds it, src/lib/images.ts).
const IMG_PREFIX = "https://cz0appsearchengine0prod.blob.core.windows.net/prod/media/cache/";
const shortImg = (u) => (u ? (u.startsWith(IMG_PREFIX) ? u.slice(IMG_PREFIX.length) : u) : null);

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
    image: shortImg(d.main_image?.thumbnail_800_600),
    thumb: shortImg(d.main_image?.thumbnail_400_300), // list avatars (56 px) – 800 px is ~6× heavier
    gallery: (d.galery_images || d.gallery_images || [])
      .map((i) => shortImg(i?.thumbnail_800_600))
      .filter(Boolean)
      .slice(0, 6),
    web: url(d.website_url),
    facebook: url(d.facebook_url),
    instagram: url(d.instagram_url),
    phone: clean(d.phone),
    email: clean(d.email),
    description: stripHtml(d.description),
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

  const prev = existsSync(OUT_INDEX) ? JSON.parse(readFileSync(OUT_INDEX, "utf8")) : null;
  const prevById = new Map((prev?.facilities ?? []).map((f) => [f.id, f]));
  const bucket = Math.floor(Date.now() / 864e5) % ROTATION_DAYS;
  const todo = features.filter(
    (f) => FULL || !prevById.has(String(f.id)) || Number(f.id) % ROTATION_DAYS === bucket,
  );
  console.log(`[detail] ${todo.length} to fetch (${FULL ? "full" : `new + rotation ${bucket + 1}/${ROTATION_DAYS}`})`);
  const fresh = {};

  let done = 0;
  let failed = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < todo.length) {
      const f = todo[cursor++];
      const raw = await api(`/api/v1/facility/${f.id}/`);
      if (raw === undefined) failed++;
      else if (raw) fresh[f.id] = normalize(f, raw);
      done++;
      if (done % 50 === 0 || done === todo.length) {
        const rate = done / ((Date.now() - started) / 1000);
        process.stdout.write(
          `\r[detail] ${done}/${todo.length}  failed ${failed}  ~${rate.toFixed(1)}/s   `,
        );
      }
      await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  process.stdout.write("\n");

  // Build index from list order. A facility whose detail failed today keeps yesterday's record;
  // only brand-new ones fall back to the bare list entry. Opening hours are carried over so a
  // failed enrich step never wipes them (enrich-osm.mjs recomputes them anyway).
  const facilities = features.map((f) => {
    const old = prevById.get(String(f.id));
    let rec = fresh[f.id];
    if (!rec && old) {
      // not refreshed today: keep the last detail, but take position/name from today's list
      const [lng, lat] = f.geometry.coordinates;
      rec = { ...old, lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
    }
    rec ??= normalize(f, { properties: { name: f.properties.name } });
    return old?.hours && !rec.hours ? { ...rec, hours: old.hours } : rec;
  });
  const withDetail = features.filter((f) => fresh[f.id] || prevById.has(String(f.id))).length;
  const coverage = withDetail / features.length;
  const failRate = todo.length ? failed / todo.length : 0;
  console.log(
    `[result] ${facilities.length} facilities, ${(coverage * 100).toFixed(1)}% with detail, ` +
      `${Object.keys(fresh).length} refreshed, ${failed} failed`,
  );

  // Safety: don't publish a broken dataset
  if (LIMIT === Infinity && coverage < 0.9) {
    throw new Error(`Detail coverage ${(coverage * 100).toFixed(1)}% < 90% – not publishing`);
  }
  if (LIMIT === Infinity && todo.length >= 50 && failRate > 0.1) {
    throw new Error(`${failed}/${todo.length} detail requests failed – not publishing`);
  }
  if (LIMIT === Infinity && prev?.facilities?.length) {
    if (facilities.length < prev.facilities.length * 0.8) {
      throw new Error(`Facility count dropped ${prev.facilities.length} → ${facilities.length} – not publishing`);
    }
    // Content gates: an API shape change would otherwise publish empty records at "100% coverage".
    const share = (list, pred) => list.filter(pred).length / Math.max(1, list.length);
    const gates = [
      ["activities", (f) => f.activities.length > 0],
      ["image", (f) => !!f.image],
      ["city", (f) => !!f.city],
      ["cards", (f) => f.cards.length > 0],
    ];
    for (const [label, pred] of gates) {
      const now = share(facilities, pred);
      const before = share(prev.facilities, pred);
      if (now < before * 0.8) {
        throw new Error(`Share with ${label} dropped ${(before * 100).toFixed(0)}% → ${(now * 100).toFixed(0)}% – not publishing`);
      }
    }
  }

  // updatedAt changes only when the data really changed (avoids pointless commits/deploys);
  // checkedAt records every successful run.
  const now = new Date().toISOString();
  const same = prev && JSON.stringify(stripVolatile(prev.facilities)) === JSON.stringify(stripVolatile(facilities));
  writeJson(OUT_INDEX, {
    updatedAt: same ? prev.updatedAt : now,
    checkedAt: now,
    count: facilities.length,
    facilities,
  });
  if (same) console.log("[result] no data changes since the last run");
  console.log(`[done] ${OUT_INDEX} in ${((Date.now() - started) / 60000).toFixed(1)} min`);
}

// Opening hours are owned by enrich-osm.mjs; compare scraped content only.
function stripVolatile(list) {
  return list.map(({ hours, ...rest }) => rest);
}

function writeJson(path, data, pretty = false) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, pretty ? 2 : 0));
}

main().catch((e) => {
  console.error("\n[error]", e.message);
  process.exit(1);
});
