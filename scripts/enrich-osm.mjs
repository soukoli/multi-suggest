#!/usr/bin/env node
/**
 * Add opening hours (and missing web/phone) to public/data/facilities.json
 * from the cached OpenStreetMap extract data/osm-pois.json (see scripts/osm-refresh.sh).
 * Works offline; if the cache is missing, it skips without failing.
 *
 * Matching: an OSM POI within 150 m whose name shares a meaningful token with the
 * facility name, or any POI within 20 m. Shops without a sport/leisure tag are ignored.
 * Data © OpenStreetMap contributors (ODbL) – attributed in the app.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const FILE = "public/data/facilities.json";
const CACHE = "data/osm-pois.json";

if (!existsSync(CACHE)) {
  console.warn(`[osm] ${CACHE} missing (run scripts/osm-refresh.sh); skipping opening hours`);
  process.exit(0);
}

const data = JSON.parse(readFileSync(FILE, "utf8"));
const { pois, fetchedAt } = JSON.parse(readFileSync(CACHE, "utf8"));

const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const STOP = new Set(["fitness", "studio", "centrum", "center", "centre", "club", "klub", "sport", "sportovni", "praha", "brno", "ostrava", "gym", "the", "and", "yoga", "joga", "wellness", "areal", "s.r.o.", "sro"]);
const tokens = (s) => new Set(fold(s).split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t)));

function dist(a, b) {
  const dLat = (b.lat - a.lat) * 111_320;
  const dLng = (b.lng - a.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

// Spatial grid (~0.01° cells) so matching 3k facilities × 10k POIs stays fast.
const grid = new Map();
const cell = (lat, lng) => `${Math.floor(lat * 100)}:${Math.floor(lng * 100)}`;
for (const p of pois) {
  p.tok = tokens(p.t.name);
  const k = cell(p.lat, p.lng);
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push(p);
}
function near(f) {
  const out = [];
  const la = Math.floor(f.lat * 100), ln = Math.floor(f.lng * 100);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) out.push(...(grid.get(`${la + i}:${ln + j}`) ?? []));
  return out;
}

let matched = 0;
for (const f of data.facilities) {
  delete f.hours;
  const ft = tokens(f.name);
  let best = null;
  for (const p of near(f)) {
    if (p.t.shop && !p.t.leisure && !p.t.sport) continue;
    const d = dist(f, p);
    if (d > 150) continue;
    const shared = [...ft].some((t) => p.tok.has(t));
    const score = (shared ? 0 : 1000) + d;
    if ((shared || d <= 20) && (!best || score < best.score)) best = { p, score };
  }
  if (!best) continue;
  const t = best.p.t;
  f.hours = t.opening_hours;
  f.web ??= t.website || t["contact:website"] || null;
  f.phone ??= t.phone || t["contact:phone"] || null;
  matched++;
}
data.hoursSource = "OpenStreetMap";
data.hoursUpdatedAt = fetchedAt;
writeFileSync(FILE, JSON.stringify(data));
console.log(`[osm] opening hours for ${matched}/${data.facilities.length} facilities (OSM extract ${fetchedAt})`);
